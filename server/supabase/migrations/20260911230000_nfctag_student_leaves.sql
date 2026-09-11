-- NFC-TAG only. Student leave / movement pass requests.

CREATE TABLE IF NOT EXISTS nfctag_student_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  student_name text NOT NULL DEFAULT '',
  student_photo text,
  grade_id text,
  section_id text,
  grade_name text NOT NULL DEFAULT '',
  section_name text NOT NULL DEFAULT '',
  leave_type text NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  left_at timestamptz,
  returned_at timestamptz,
  reviewed_by text,
  reviewed_by_name text,
  reviewed_by_role text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_student_leaves_student_idx
  ON nfctag_student_leaves (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS nfctag_student_leaves_status_idx
  ON nfctag_student_leaves (status, created_at DESC);

CREATE INDEX IF NOT EXISTS nfctag_student_leaves_class_idx
  ON nfctag_student_leaves (grade_id, section_id, created_at DESC);

ALTER TABLE nfctag_student_leaves DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON nfctag_student_leaves
TO anon, authenticated, service_role;

COMMENT ON TABLE nfctag_student_leaves IS 'NFC-TAG project only — student leave/pass requests';
