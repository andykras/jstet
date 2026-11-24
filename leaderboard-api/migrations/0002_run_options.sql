-- Display options ride along with each published result.
ALTER TABLE scores ADD COLUMN hard_drop INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scores ADD COLUMN single_block INTEGER NOT NULL DEFAULT 1;
