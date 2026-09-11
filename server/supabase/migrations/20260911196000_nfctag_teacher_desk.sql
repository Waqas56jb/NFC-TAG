CREATE TABLE IF NOT EXISTS nfctag_teacher_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  teacher_name text,
  work_date date NOT NULL,
  check_in_at timestamptz,
  check_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS nfctag_teacher_days_uq
  ON nfctag_teacher_days (teacher_id, work_date);

CREATE INDEX IF NOT EXISTS nfctag_teacher_days_date_idx
  ON nfctag_teacher_days (work_date DESC);

CREATE TABLE IF NOT EXISTS nfctag_teacher_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL,
  teacher_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_by_name text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_teacher_leaves_status_idx
  ON nfctag_teacher_leaves (status, created_at DESC);

CREATE TABLE IF NOT EXISTS nfctag_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  role text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_notifications_user_idx
  ON nfctag_notifications (user_id, created_at DESC);

ALTER TABLE nfctag_teacher_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_teacher_leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_notifications DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  nfctag_teacher_days,
  nfctag_teacher_leaves,
  nfctag_notifications
TO anon, authenticated, service_role;

COMMENT ON TABLE nfctag_teacher_days IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_teacher_leaves IS 'NFC-TAG project only';
COMMENT ON TABLE nfctag_notifications IS 'NFC-TAG project only';
