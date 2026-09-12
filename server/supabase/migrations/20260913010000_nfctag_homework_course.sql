-- Assignments: course name + indexes (safe to re-run)
ALTER TABLE nfctag_homework
  ADD COLUMN IF NOT EXISTS course_name text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS nfctag_homework_course_idx
  ON nfctag_homework (grade_id, section_id, course_name, created_at DESC);

COMMENT ON COLUMN nfctag_homework.course_name IS 'Subject / course label shown to students (e.g. Mathematics)';
