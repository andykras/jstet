// A minimal, separate Cloudflare Worker: the game never needs a backend to play.
const RULESET = 'arcade-v1'
const MODES = new Set(['tetcolor', 'classic'])
const PERIODS = new Set(['week', 'all'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BODY_SIZE = 2048
const TOP_SIZE = 20

export const weekStartUtc = (timestamp = Date.now()) => {
  const date = new Date(timestamp)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday)
}

export const normalizedNickname = value => {
  if (typeof value !== 'string') return null
  const nickname = value.trim().normalize('NFC')
  return /^[\p{L}\p{N}_-]{3,16}$/u.test(nickname) ? nickname : null
}

export const validateRun = run => {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return 'Invalid game result.'
  if (!UUID.test(run.runId || '')) return 'Invalid run identifier.'
  if (!MODES.has(run.mode) || run.ruleset !== RULESET) return 'Invalid game mode or ruleset.'
  // Display options ride along with the result; every finished game ranks.
  for (const flag of ['hardDrop', 'singleBlock']) {
    if (flag in run && typeof run[flag] !== 'boolean') return 'Invalid run options.'
  }
  if (!Number.isSafeInteger(run.score) || run.score < 1 || run.score > 25000000) return 'Invalid score.'
  if (!Number.isSafeInteger(run.cleared) || run.cleared < 0 || run.cleared > 100000) return 'Invalid cleared count.'
  if (!Number.isSafeInteger(run.level) || run.level < 0 || run.level > 8) return 'Invalid level.'
  if (!Number.isSafeInteger(run.durationMs) || run.durationMs < 1000 || run.durationMs > 8 * 60 * 60 * 1000) {
    return 'Invalid run duration.'
  }
  return null
}

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
})

const readJson = async request => {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_SIZE) return null
  const text = await request.text()
  if (text.length > MAX_BODY_SIZE) return null
  try {
    return JSON.parse(text)
  } catch (_) {
    return null
  }
}

const sha256 = async input => {
  const data = new TextEncoder().encode(input)
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')

const authenticatedPlayer = async (request, env) => {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get('Authorization') || '')
  if (!match) return null
  const hash = await sha256(match[1])
  return env.DB.prepare('SELECT id, nickname FROM players WHERE token_hash = ?').bind(hash).first()
}

const registerRateCheck = async (request, env, now) => {
  // Fail closed: a deployment without its rate-limit secret must not allow unlimited signups.
  if (!env.RATE_LIMIT_SALT || env.RATE_LIMIT_SALT.length < 20) return 'Leaderboard registration is not configured.'
  const ip = request.headers.get('CF-Connecting-IP') || 'local-development'
  const fingerprint = await sha256(env.RATE_LIMIT_SALT + ':' + ip)
  const cutoff = now - 60 * 60 * 1000
  await env.DB.prepare(`
    INSERT INTO signup_limits (fingerprint, window_start_ms, attempts) VALUES (?, ?, 1)
    ON CONFLICT(fingerprint) DO UPDATE SET
      attempts = CASE WHEN window_start_ms < ? THEN 1 ELSE attempts + 1 END,
      window_start_ms = CASE WHEN window_start_ms < ? THEN ? ELSE window_start_ms END
  `).bind(fingerprint, now, cutoff, cutoff, now).run()
  const limit = await env.DB.prepare('SELECT attempts FROM signup_limits WHERE fingerprint = ?').bind(fingerprint).first()
  return limit.attempts > 5 ? 'Too many registrations. Try again later.' : null
}

const createPlayer = async (request, env) => {
  const body = await readJson(request)
  const nickname = normalizedNickname(body?.nickname)
  if (!nickname) return json({ error: 'Use 3–16 letters, digits, underscores or hyphens.' }, 400)

  const now = Date.now()
  const limitError = await registerRateCheck(request, env, now)
  if (limitError) return json({ error: limitError }, limitError.startsWith('Too many') ? 429 : 503)

  const id = crypto.randomUUID()
  const token = newToken()
  await env.DB.prepare('INSERT INTO players (id, nickname, token_hash, created_ms) VALUES (?, ?, ?, ?)')
    .bind(id, nickname, await sha256(token), now).run()
  return json({ id, nickname, token }, 201)
}

const rankQuery = `
  WITH per_player AS (
    SELECT player_id, score, cleared, level, duration_ms, hard_drop, single_block,
      ROW_NUMBER() OVER (
        PARTITION BY player_id ORDER BY score DESC, created_ms ASC, id ASC
      ) AS best_index
    FROM scores
    WHERE mode = ? AND ruleset = ? AND created_ms >= ?
  ), ranked AS (
    SELECT players.id AS player_id, players.nickname,
      per_player.score, per_player.cleared, per_player.level, per_player.duration_ms,
      per_player.hard_drop, per_player.single_block,
      ROW_NUMBER() OVER (ORDER BY per_player.score DESC, players.id ASC) AS position
    FROM per_player
    JOIN players ON players.id = per_player.player_id
    WHERE per_player.best_index = 1
  )
`

const toEntry = row => ({
  playerId: row.player_id, nickname: row.nickname, score: row.score, rank: row.position,
  cleared: row.cleared ?? null, level: row.level ?? null, durationMs: row.duration_ms ?? null,
  hardDrop: row.hard_drop == null ? null : row.hard_drop === 1,
  singleBlock: row.single_block == null ? null : row.single_block === 1
})

const leaderboard = async (request, env, url) => {
  const mode = url.searchParams.get('mode') || 'tetcolor'
  const period = url.searchParams.get('period') || 'week'
  if (!MODES.has(mode) || !PERIODS.has(period)) return json({ error: 'Invalid ranking selection.' }, 400)
  const since = period === 'week' ? weekStartUtc() : 0

  const rows = await env.DB.prepare(rankQuery + ' SELECT * FROM ranked ORDER BY position LIMIT ?')
    .bind(mode, RULESET, since, TOP_SIZE).all()
  const player = await authenticatedPlayer(request, env)
  const myRow = player
    ? await env.DB.prepare(rankQuery + ' SELECT * FROM ranked WHERE player_id = ?')
      .bind(mode, RULESET, since, player.id).first()
    : null
  return json({
    mode, period, ruleset: RULESET,
    weekStartsAt: period === 'week' ? new Date(since).toISOString() : null,
    entries: (rows.results || []).map(toEntry),
    mine: myRow
      ? {
        score: myRow.score, rank: myRow.position,
        cleared: myRow.cleared ?? null, level: myRow.level ?? null, durationMs: myRow.duration_ms ?? null,
        hardDrop: myRow.hard_drop == null ? null : myRow.hard_drop === 1,
        singleBlock: myRow.single_block == null ? null : myRow.single_block === 1
      }
      : null
  })
}

const postScore = async (request, env) => {
  const player = await authenticatedPlayer(request, env)
  if (!player) return json({ error: 'Player session not found. Choose a new nickname.' }, 401)
  const run = await readJson(request)
  const error = validateRun(run)
  if (error) return json({ error }, 400)

  const existing = await env.DB.prepare('SELECT id FROM scores WHERE player_id = ? AND run_id = ?')
    .bind(player.id, run.runId).first()
  if (existing) return json({ accepted: true, duplicate: true })

  const now = Date.now()
  const recent = await env.DB.prepare('SELECT created_ms FROM scores WHERE player_id = ? ORDER BY created_ms DESC LIMIT 1')
    .bind(player.id).first()
  if (recent && now - recent.created_ms < 10000) {
    return json({ error: 'Please wait before publishing another result.' }, 429)
  }

  // One row per player/run also protects against retries racing across requests.
  const saved = await env.DB.prepare(`
    INSERT OR IGNORE INTO scores
      (id, player_id, run_id, mode, ruleset, score, cleared, level, duration_ms,
       hard_drop, single_block, created_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(), player.id, run.runId, run.mode, run.ruleset, run.score, run.cleared,
    run.level, run.durationMs, run.hardDrop === true ? 1 : 0, run.singleBlock !== false ? 1 : 0, now
  ).run()
  return json({ accepted: true, duplicate: saved.meta?.changes === 0 }, 201)
}

export async function handleRequest(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = (env.ALLOWED_ORIGINS || 'https://tetcolor.andykras.org,http://localhost:1337,http://127.0.0.1:1337')
    .split(',').map(value => value.trim())
  if (origin && !allowed.includes(origin)) return json({ error: 'Origin not allowed.' }, 403)

  const cors = response => {
    if (origin) response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    return response
  }
  if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))

  try {
    if (!env.DB) return cors(json({ error: 'Database binding is missing.' }, 503))
    const url = new URL(request.url)
    let result
    if (url.pathname === '/api/v1/health' && request.method === 'GET') {
      // A database query ensures the schema exists before the frontend uses the API.
      await env.DB.prepare('SELECT id FROM players LIMIT 1').first()
      result = json({ status: 'ok', ruleset: RULESET })
    } else if (url.pathname === '/api/v1/leaderboard' && request.method === 'GET') result = await leaderboard(request, env, url)
    else if (url.pathname === '/api/v1/players' && request.method === 'POST') result = await createPlayer(request, env)
    else if (url.pathname === '/api/v1/scores' && request.method === 'POST') result = await postScore(request, env)
    else result = json({ error: 'Endpoint not found.' }, 404)
    return cors(result)
  } catch (error) {
    console.error('Leaderboard API failure:', error?.message || 'unknown error')
    return cors(json({ error: 'Leaderboard service is temporarily unavailable.' }, 503))
  }
}

export default {
  fetch(request, env) {
    return handleRequest(request, env)
  }
}
