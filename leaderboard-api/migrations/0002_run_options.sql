-- Display options ride along with each published result.
-- Existing results did not record these settings; NULL means unknown.
ALTER TABLE scores ADD COLUMN hard_drop INTEGER;
ALTER TABLE scores ADD COLUMN single_block INTEGER;
