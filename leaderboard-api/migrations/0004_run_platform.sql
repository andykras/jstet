-- Device type is optional display metadata, never a ranking key.
-- Legacy results are deliberately NULL: the device cannot be reconstructed.
ALTER TABLE scores ADD COLUMN platform TEXT
  CHECK(platform IS NULL OR platform IN ('mobile', 'desktop'));
