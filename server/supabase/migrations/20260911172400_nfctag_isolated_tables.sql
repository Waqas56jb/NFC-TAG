-- NFC-TAG only. Table names use nfctag_ so other project tables stay untouched.
-- This file never DROPs or ALTERs tables that are not nfctag_*.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS nfctag_madam (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nfctag_sub_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nfctag_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  subject text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nfctag_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nfctag_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES nfctag_grades(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade_id, name)
);

CREATE TABLE IF NOT EXISTS nfctag_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES nfctag_grades(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES nfctag_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  age text,
  gender text,
  dob date,
  nic text,
  roll_no text,
  blood_group text,
  address text,
  parent_name text,
  parent_phone text,
  parent_email text,
  emergency_phone text,
  notes text,
  photo text,
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nfctag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES nfctag_teachers(id) ON DELETE CASCADE,
  grade_id uuid NOT NULL REFERENCES nfctag_grades(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES nfctag_sections(id) ON DELETE CASCADE,
  hidden boolean NOT NULL DEFAULT false,
  created_by text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, grade_id, section_id)
);

CREATE TABLE IF NOT EXISTS nfctag_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attend_date date NOT NULL,
  grade_id uuid NOT NULL REFERENCES nfctag_grades(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES nfctag_sections(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES nfctag_teachers(id) ON DELETE SET NULL,
  teacher_name text,
  marks jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attend_date, grade_id, section_id)
);

CREATE TABLE IF NOT EXISTS nfctag_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text,
  actor_name text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_name text,
  detail text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_students_class_idx ON nfctag_students (grade_id, section_id);
CREATE INDEX IF NOT EXISTS nfctag_assignments_teacher_idx ON nfctag_assignments (teacher_id);
CREATE INDEX IF NOT EXISTS nfctag_attendance_class_date_idx ON nfctag_attendance (grade_id, section_id, attend_date);
CREATE INDEX IF NOT EXISTS nfctag_activities_at_idx ON nfctag_activities (at DESC);

COMMENT ON TABLE nfctag_madam IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_sub_users IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_teachers IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_grades IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_sections IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_students IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_assignments IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_attendance IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_activities IS 'NFC-TAG project only';
