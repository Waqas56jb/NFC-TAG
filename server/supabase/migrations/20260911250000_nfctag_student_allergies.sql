-- Public safety fields for AMAN NFC child page

ALTER TABLE nfctag_students
  ADD COLUMN IF NOT EXISTS allergies text;

COMMENT ON COLUMN nfctag_students.allergies IS 'Public safety: allergy information shown on NFC scan page';
