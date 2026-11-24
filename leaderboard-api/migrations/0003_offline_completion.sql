-- Retain the original completion date of scores queued during offline play.
-- Legacy scores without this field fall back to their original submission date.
ALTER TABLE scores ADD COLUMN completed_ms INTEGER;
CREATE INDEX IF NOT EXISTS scores_by_completed_week
  ON scores(mode, ruleset, completed_ms, player_id, score DESC);
