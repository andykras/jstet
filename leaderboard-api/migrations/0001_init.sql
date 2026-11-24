-- IDs and anonymous credentials are independent of any JSTET gameplay state.
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('tetcolor', 'classic')),
  ruleset TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score > 0),
  cleared INTEGER NOT NULL CHECK(cleared >= 0),
  level INTEGER NOT NULL CHECK(level >= 0),
  duration_ms INTEGER NOT NULL CHECK(duration_ms >= 1000),
  created_ms INTEGER NOT NULL,
  UNIQUE(player_id, run_id)
);

CREATE INDEX IF NOT EXISTS scores_by_mode_period
  ON scores(mode, ruleset, created_ms, player_id, score DESC);
CREATE INDEX IF NOT EXISTS scores_by_player
  ON scores(player_id, created_ms DESC);

-- IP addresses are never stored. This table contains only salted SHA-256 fingerprints.
CREATE TABLE IF NOT EXISTS signup_limits (
  fingerprint TEXT PRIMARY KEY,
  window_start_ms INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
