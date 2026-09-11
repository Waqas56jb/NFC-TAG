-- Optional unique public NFC/QR code per student (falls back to id if null).

ALTER TABLE nfctag_students
  ADD COLUMN IF NOT EXISTS tag_code text;

CREATE UNIQUE INDEX IF NOT EXISTS nfctag_students_tag_code_uq
  ON nfctag_students (tag_code)
  WHERE tag_code IS NOT NULL;

COMMENT ON COLUMN nfctag_students.tag_code IS 'NFC-TAG public scan code for /c/:code';
