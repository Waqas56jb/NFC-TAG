ALTER TABLE nfctag_groups
  ADD COLUMN IF NOT EXISTS photo text;

COMMENT ON COLUMN nfctag_groups.photo IS 'Group avatar (data URL or https image)';
