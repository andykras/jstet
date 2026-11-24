const STORAGE_KEY = 'jstet.leaderboard.player.v1'
const API_URL = (import.meta.env?.VITE_LEADERBOARD_API_URL || '').trim().replace(/\/$/, '')

export const leaderboardConfigured = Boolean(API_URL)

const storage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch (_) {
    return null
  }
}

export const readLeaderboardPlayer = (target = storage()) => {
  if (!target) return null
  try {
    const value = JSON.parse(target.getItem(STORAGE_KEY) || 'null')
    if (typeof value?.id !== 'string' || typeof value?.nickname !== 'string' ||
      typeof value?.token !== 'string' || !/^[a-f0-9]{64}$/i.test(value.token)) return null
    return value
  } catch (_) {
    return null
  }
}

const storePlayer = player => {
  const target = storage()
  if (!target) throw new Error('Allow browser storage to keep your leaderboard profile.')
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(player))
  } catch (_) {
    throw new Error('Allow browser storage to keep your leaderboard profile.')
  }
}

export const leaderboardOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false

const apiRequest = async(path, { method = 'GET', token, body } = {}) => {
  if (!leaderboardConfigured) throw new Error('Online leaderboard is not configured yet.')
  if (!leaderboardOnline()) throw new Error('Offline. Your score is safe on this device.')

  // Even an unresponsive connection must never hold the game or modal indefinitely.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), method === 'GET' ? 5000 : 8000)
  try {
    const response = await fetch(API_URL + path, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(data.error || 'Leaderboard service is unavailable.')
      error.status = response.status
      throw error
    }
    return data
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Leaderboard request timed out. You can continue playing.')
    if (error instanceof TypeError) throw new Error('Cannot reach the leaderboard. You can continue playing.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const CACHE_KEY = 'jstet.leaderboard.snapshots.v1'

const currentWeekStart = () => {
  const now = new Date()
  const monday = (now.getUTCDay() + 6) % 7
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - monday)
}

export const cachedLeaderboard = (mode, period, player = readLeaderboardPlayer(), target = storage()) => {
  if (!target) return null
  try {
    const cache = JSON.parse(target.getItem(CACHE_KEY) || '{}')
    const snapshot = cache[mode + ':' + period]
    if (!snapshot || !Array.isArray(snapshot.data?.entries) || !Number.isFinite(snapshot.cachedAtMs)) return null
    if (period === 'week' && Date.parse(snapshot.data.weekStartsAt) !== currentWeekStart()) return null
    return {
      ...snapshot.data,
      mine: snapshot.playerId && snapshot.playerId === player?.id ? snapshot.data.mine : null,
      cachedAtMs: snapshot.cachedAtMs
    }
  } catch (_) {
    return null
  }
}

export const fetchLeaderboard = async(mode, period, player = readLeaderboardPlayer()) => {
  const data = await apiRequest(
    '/api/v1/leaderboard?mode=' + encodeURIComponent(mode) + '&period=' + encodeURIComponent(period),
    { token: player?.token }
  )
  const target = storage()
  if (target && Array.isArray(data.entries)) {
    try {
      const cache = JSON.parse(target.getItem(CACHE_KEY) || '{}')
      cache[mode + ':' + period] = { data, playerId: player?.id || null, cachedAtMs: Date.now() }
      target.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch (_) {
      // Cached rankings are optional and must never stop normal gameplay.
    }
  }
  return data
}

export const registerLeaderboardPlayer = async nickname => {
  const data = await apiRequest('/api/v1/players', {
    method: 'POST',
    body: { nickname: nickname.trim() }
  })
  const player = { id: data.id, nickname: data.nickname, token: data.token }
  storePlayer(player)
  return player
}

export const publishLeaderboardRun = (run, player = readLeaderboardPlayer()) => {
  if (!player) throw new Error('Choose a nickname before publishing a score.')
  return apiRequest('/api/v1/scores', { method: 'POST', token: player.token, body: run })
}

export const isLeaderboardAutoPublishEnabled = (player = readLeaderboardPlayer()) => Boolean(player && player.autoPublish !== false)

export const setLeaderboardAutoPublish = enabled => {
  const player = readLeaderboardPlayer()
  if (!player) throw new Error('Leaderboard profile is unavailable.')
  const updated = { ...player, autoPublish: enabled === true }
  storePlayer(updated)
  return updated
}

export const forgetLeaderboardPlayer = () => {
  const target = storage()
  if (!target) return false
  try {
    target.removeItem(STORAGE_KEY)
    return true
  } catch (_) {
    return false
  }
}
