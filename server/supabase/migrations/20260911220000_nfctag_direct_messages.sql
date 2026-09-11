CREATE TABLE IF NOT EXISTS nfctag_dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id text NOT NULL,
  staff_role text NOT NULL CHECK (staff_role IN ('madam', 'teacher', 'sub')),
  staff_name text NOT NULL DEFAULT '',
  student_id uuid NOT NULL REFERENCES nfctag_students(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS nfctag_dm_threads_pair_uq
  ON nfctag_dm_threads (staff_id, staff_role, student_id);

CREATE INDEX IF NOT EXISTS nfctag_dm_threads_student_idx
  ON nfctag_dm_threads (student_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS nfctag_dm_threads_staff_idx
  ON nfctag_dm_threads (staff_id, staff_role, last_message_at DESC);

CREATE TABLE IF NOT EXISTS nfctag_dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES nfctag_dm_threads(id) ON DELETE CASCADE,
  author_id text,
  author_name text NOT NULL,
  author_role text NOT NULL,
  body text NOT NULL DEFAULT '',
  file_name text,
  file_type text,
  file_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nfctag_dm_messages_thread_idx
  ON nfctag_dm_messages (thread_id, created_at);

ALTER TABLE nfctag_dm_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_dm_messages DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE nfctag_dm_threads TO anon, authenticated, service_role;
GRANT ALL ON TABLE nfctag_dm_messages TO anon, authenticated, service_role;

COMMENT ON TABLE nfctag_dm_threads IS 'NFC-TAG 1:1 chats staff <-> student';
COMMENT ON TABLE nfctag_dm_messages IS 'NFC-TAG direct messages with optional attachments';
