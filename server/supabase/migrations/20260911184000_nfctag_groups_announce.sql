ALTER TABLE nfctag_students
  ADD COLUMN IF NOT EXISTS login_email text,
  ADD COLUMN IF NOT EXISTS password text;

CREATE UNIQUE INDEX IF NOT EXISTS nfctag_students_login_email_uq
  ON nfctag_students (login_email)
  WHERE login_email IS NOT NULL AND login_email <> '';

CREATE TABLE IF NOT EXISTS nfctag_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('grade', 'section')),
  grade_id uuid NOT NULL REFERENCES nfctag_grades(id) ON DELETE CASCADE,
  section_id uuid REFERENCES nfctag_sections(id) ON DELETE CASCADE,
  created_by text,
  created_by_name text,
  created_by_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS nfctag_groups_section_uq
  ON nfctag_groups (section_id)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS nfctag_groups_grade_uq
  ON nfctag_groups (grade_id)
  WHERE section_id IS NULL;

CREATE TABLE IF NOT EXISTS nfctag_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES nfctag_groups(id) ON DELETE CASCADE,
  author_id text,
  author_name text NOT NULL,
  author_role text NOT NULL,
  body text NOT NULL DEFAULT '',
  file_name text,
  file_type text,
  file_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_group_messages_group_idx
  ON nfctag_group_messages (group_id, created_at);

CREATE TABLE IF NOT EXISTS nfctag_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  author_id text,
  author_name text NOT NULL,
  author_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nfctag_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_group_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_announcements DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  nfctag_groups,
  nfctag_group_messages,
  nfctag_announcements
TO anon, authenticated, service_role;

COMMENT ON TABLE nfctag_groups IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_group_messages IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_announcements IS 'NFC-TAG project only';
