<?php
// JSTET leaderboard API for kraspeed: one same-origin PHP endpoint, no extra
// port or service. Mirrors the Cloudflare Worker contract in ../src/worker.js.
declare(strict_types=1);

const RULESET = 'arcade-v1';
const TOP_SIZE = 20;
const MAX_BODY = 2048;
const DATA_DIR = '/srv/tetcolor/api-data';
const ALLOWED_ORIGINS = 'https://tetcolor.andykras.org,http://localhost:1337,http://127.0.0.1:1337';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Vary: Origin');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_map('trim', explode(',', ALLOWED_ORIGINS));
if ($origin !== '' && !in_array($origin, $allowed, true)) {
    respond(['error' => 'Origin not allowed.'], 403);
}
if ($origin !== '') header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(array $value, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 503): never
{
    error_log('Leaderboard API failure: ' . $message);
    respond(['error' => 'Leaderboard service is temporarily unavailable.'], $status);
}

function read_json(): ?array
{
    $declared = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($declared > MAX_BODY) return null;
    $text = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
    if ($text === false || strlen($text) > MAX_BODY) return null;
    $value = json_decode($text, true);
    return is_array($value) ? $value : null;
}

function sha256(string $value): string
{
    return hash('sha256', $value);
}

function new_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
}

function normalized_nickname(mixed $value): ?string
{
    if (!is_string($value)) return null;
    $nickname = trim(Normalizer::normalize($value, Normalizer::FORM_C) ?: $value);
    return preg_match('/^[\p{L}\p{N}_-]{3,16}$/u', $nickname) ? $nickname : null;
}

function valid_uuid(string $value): bool
{
    return (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value);
}

function validate_run(mixed $run): ?string
{
    if (!is_array($run) || array_is_list($run)) return 'Invalid game result.';
    if (!valid_uuid((string)($run['runId'] ?? ''))) return 'Invalid run identifier.';
    // Gameplay settings are not ranking categories: only TetColor and Classic differ.
    if (!in_array($run['mode'] ?? null, ['tetcolor', 'classic'], true) ||
        ($run['ruleset'] ?? null) !== RULESET) {
        return 'Invalid game mode or ruleset.';
    }
    foreach ([['score', 1, 25000000], ['cleared', 0, 100000], ['level', 0, 8]] as [$key, $min, $max]) {
        $value = $run[$key] ?? null;
        if (!is_int($value) || $value < $min || $value > $max) return 'Invalid ' . $key . '.';
    }
    $duration = $run['durationMs'] ?? null;
    if (!is_int($duration) || $duration < 1000 || $duration > 8 * 60 * 60 * 1000) return 'Invalid run duration.';
    return null;
}

function week_start_utc(?int $timestampMs = null): int
{
    $date = new DateTimeImmutable('@' . intdiv($timestampMs ?? (int)round(microtime(true) * 1000), 1000));
    $date = $date->setTimezone(new DateTimeZone('UTC'))->setTime(0, 0);
    $daysSinceMonday = ((int)$date->format('N')) - 1;
    return $date->modify('-' . $daysSinceMonday . ' days')->getTimestamp() * 1000;
}

// All writes serialize on one lock file; the state file is replaced atomically
// so a crash never leaves a half-written JSON document behind.
function with_state(callable $mutator): mixed
{
    if (!is_dir(DATA_DIR) || !is_writable(DATA_DIR)) fail('storage directory is unavailable');
    $lock = fopen(DATA_DIR . '/state.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX)) fail('cannot lock storage');
    try {
        $path = DATA_DIR . '/state.json';
        $raw = is_file($path) ? file_get_contents($path) : '';
        $state = $raw === '' ? null : json_decode($raw, true);
        if (!is_array($state)) $state = [];
        $state += ['players' => [], 'bests' => [], 'runs' => [], 'limits' => []];
        $result = $mutator($state);
        $tmp = $path . '.tmp';
        $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || file_put_contents($tmp, $json) === false || !rename($tmp, $path)) {
            fail('cannot persist storage');
        }
        return $result;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer ([a-f0-9]{64})$/i', $header, $match) ? strtolower($match[1]) : null;
}

function find_player(array $state): ?array
{
    $token = bearer_token();
    if ($token === null) return null;
    $hash = sha256($token);
    foreach ($state['players'] as $player) {
        if (hash_equals($player['tokenHash'], $hash)) return $player;
    }
    return null;
}

function client_fingerprint(string $salt): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'local-development';
    return sha256($salt . ':' . $ip);
}

function create_player(string $salt): never
{
    $body = read_json();
    $nickname = normalized_nickname($body['nickname'] ?? null);
    if ($nickname === null) {
        respond(['error' => 'Use 3–16 letters, digits, underscores or hyphens.'], 400);
    }

    $now = (int)round(microtime(true) * 1000);
    $fingerprint = client_fingerprint($salt);
    $tooMany = false;
    $token = bin2hex(random_bytes(32));
    $player = with_state(function (array &$state) use ($nickname, $now, $fingerprint, $token, &$tooMany): ?array {
        $cutoff = $now - 60 * 60 * 1000;
        foreach ($state['limits'] as $key => $limit) {
            if (($limit['windowStart'] ?? 0) < $cutoff) unset($state['limits'][$key]);
        }
        $limit = $state['limits'][$fingerprint] ?? null;
        if ($limit === null || ($limit['windowStart'] ?? 0) < $cutoff) {
            $limit = ['windowStart' => $now, 'attempts' => 0];
        }
        $limit['attempts']++;
        $state['limits'][$fingerprint] = $limit;
        if ($limit['attempts'] > 5) {
            $tooMany = true;
            return null;
        }
        $player = [
            'id' => new_uuid(),
            'nickname' => $nickname,
            'tokenHash' => sha256($token),
            'createdMs' => $now
        ];
        $state['players'][$player['id']] = $player;
        return $player;
    });

    if ($tooMany) respond(['error' => 'Too many registrations. Try again later.'], 429);
    respond(['id' => $player['id'], 'nickname' => $player['nickname'], 'token' => $token], 201);
}

function publish_score(): never
{
    $player = with_state(fn(array &$state) => find_player($state));
    if ($player === null) respond(['error' => 'Player session not found. Choose a new nickname.'], 401);
    $run = read_json();
    $error = validate_run($run);
    if ($error !== null) respond(['error' => $error], 400);

    $now = (int)round(microtime(true) * 1000);
    $accepted = with_state(function (array &$state) use ($player, $run, $now): array {
        $id = $player['id'];
        $runs = $state['runs'][$id] ?? [];
        if (isset($runs[$run['runId']])) return ['accepted' => true, 'duplicate' => true];

        $lastScoreMs = (int)($state['players'][$id]['lastScoreMs'] ?? 0);
        if ($lastScoreMs > 0 && $now - $lastScoreMs < 10000) {
            return ['error' => 'Please wait before publishing another result.', 'status' => 429];
        }

        $week = (string)week_start_utc($now);
        foreach (['all', $week] as $bucket) {
            $key = $id . '|' . $run['mode'] . '|' . $bucket;
            $best = $state['bests'][$key] ?? null;
            if ($best === null || $run['score'] > $best['score']) {
                $state['bests'][$key] = [
                    'playerId' => $id,
                    'mode' => $run['mode'],
                    'week' => $bucket,
                    'score' => $run['score'],
                    'cleared' => $run['cleared'],
                    'level' => $run['level'],
                    'durationMs' => $run['durationMs'],
                    'createdMs' => $now
                ];
            }
        }
        $state['players'][$id]['lastScoreMs'] = $now;

        $runs[$run['runId']] = $now;
        if (count($runs) > 200) {
            asort($runs);
            $runs = array_slice($runs, -200, null, true);
        }
        $state['runs'][$id] = $runs;
        return ['accepted' => true, 'duplicate' => false];
    });

    if (isset($accepted['error'])) respond(['error' => $accepted['error']], $accepted['status']);
    respond($accepted, 201);
}

function leaderboard(): never
{
    $mode = $_GET['mode'] ?? 'tetcolor';
    $period = $_GET['period'] ?? 'week';
    if (!in_array($mode, ['tetcolor', 'classic'], true) || !in_array($period, ['week', 'all'], true)) {
        respond(['error' => 'Invalid ranking selection.'], 400);
    }
    $week = (string)week_start_utc();

    $payload = with_state(function (array &$state) use ($mode, $period, $week): array {
        $rows = [];
        foreach ($state['bests'] as $best) {
            if ($best['mode'] !== $mode) continue;
            if ($period === 'week' && $best['week'] !== $week) continue;
            $id = $best['playerId'];
            if (!isset($rows[$id]) || $best['score'] > $rows[$id]['score']) $rows[$id] = $best;
        }
        $ranked = [];
        foreach ($rows as $id => $best) {
            $ranked[] = [
                'playerId' => $id,
                'nickname' => $state['players'][$id]['nickname'] ?? '—',
                'score' => $best['score']
            ];
        }
        usort($ranked, fn(array $a, array $b): int => $b['score'] <=> $a['score'] ?: strcmp($a['playerId'], $b['playerId']));
        $mine = null;
        $player = find_player($state);
        foreach ($ranked as $index => $row) {
            if ($player !== null && $row['playerId'] === $player['id']) {
                $mine = ['score' => $row['score'], 'rank' => $index + 1];
                break;
            }
        }
        return ['ranked' => $ranked, 'mine' => $mine];
    });

    $entries = [];
    foreach ($payload['ranked'] as $index => $row) {
        if ($index >= TOP_SIZE) break;
        $entries[] = [
            'playerId' => $row['playerId'],
            'nickname' => $row['nickname'],
            'score' => $row['score'],
            'rank' => $index + 1
        ];
    }
    respond([
        'mode' => $mode,
        'period' => $period,
        'ruleset' => RULESET,
        'weekStartsAt' => $period === 'week' ? gmdate('Y-m-d\TH:i:s.000\Z', intdiv(week_start_utc(), 1000)) : null,
        'entries' => $entries,
        'mine' => $payload['mine']
    ]);
}

$configPath = DATA_DIR . '/config.php';
if (!is_file($configPath)) fail('missing configuration');
$config = require $configPath;
$salt = is_array($config) ? (string)($config['salt'] ?? '') : '';
if (strlen($salt) < 20) fail('registration is not configured');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

try {
    if ($path === '/api/v1/health' && $method === 'GET') {
        $state = with_state(fn(array &$state) => array_keys($state));
        respond(['status' => 'ok', 'ruleset' => RULESET]);
    }
    if ($path === '/api/v1/leaderboard' && $method === 'GET') leaderboard();
    if ($path === '/api/v1/players' && $method === 'POST') create_player($salt);
    if ($path === '/api/v1/scores' && $method === 'POST') publish_score();
    respond(['error' => 'Endpoint not found.'], 404);
} catch (Throwable $error) {
    fail($error->getMessage());
}
