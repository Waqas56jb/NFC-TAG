CREATE TABLE IF NOT EXISTS nfctag_homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  teacher_name text NOT NULL DEFAULT '',
  grade_id uuid,
  section_id uuid,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  due_at timestamptz,
  file_name text,
  file_type text,
  file_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_homework_class_idx
  ON nfctag_homework (grade_id, section_id, created_at DESC);

CREATE INDEX IF NOT EXISTS nfctag_homework_teacher_idx
  ON nfctag_homework (teacher_id, created_at DESC);

ALTER TABLE nfctag_homework DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE nfctag_homework TO anon, authenticated, service_role;

COMMENT ON TABLE nfctag_homework IS 'NFC-TAG class homework / assignments for students to view';
