-- NFC-TAG only. Grants and seed touch nfctag_* tables exclusively.

ALTER TABLE nfctag_madam DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_sub_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE nfctag_activities DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  nfctag_madam,
  nfctag_sub_users,
  nfctag_teachers,
  nfctag_grades,
  nfctag_sections,
  nfctag_students,
  nfctag_assignments,
  nfctag_attendance,
  nfctag_activities
TO anon, authenticated;

TRUNCATE TABLE
  nfctag_activities,
  nfctag_attendance,
  nfctag_assignments,
  nfctag_students,
  nfctag_sections,
  nfctag_grades,
  nfctag_teachers,
  nfctag_sub_users,
  nfctag_madam
RESTART IDENTITY CASCADE;

INSERT INTO nfctag_madam (id, name, email, password) VALUES
  ('a1111111-1111-4111-8111-000000000001', 'Principal Madam', 'madam@nfctag.edu', 'Madam@123'),
  ('a1111111-1111-4111-8111-000000000002', 'Madam Sana', 'madam2@nfctag.edu', 'Madam@123'),
  ('a1111111-1111-4111-8111-000000000003', 'Madam Hina', 'madam3@nfctag.edu', 'Madam@123'),
  ('a1111111-1111-4111-8111-000000000004', 'Madam Rabia', 'madam4@nfctag.edu', 'Madam@123'),
  ('a1111111-1111-4111-8111-000000000005', 'Madam Iqra', 'madam5@nfctag.edu', 'Madam@123');

INSERT INTO nfctag_sub_users (id, name, email, password, status) VALUES
  ('b2222222-2222-4222-8222-000000000001', 'Ayesha Khan', 'ayesha@nfctag.edu', 'Ayesha@123', 'active'),
  ('b2222222-2222-4222-8222-000000000002', 'Omar Sheikh', 'sub2@nfctag.edu', 'Sub@123', 'active'),
  ('b2222222-2222-4222-8222-000000000003', 'Nida Farooq', 'sub3@nfctag.edu', 'Sub@123', 'active'),
  ('b2222222-2222-4222-8222-000000000004', 'Hamza Ali', 'sub4@nfctag.edu', 'Sub@123', 'active'),
  ('b2222222-2222-4222-8222-000000000005', 'Saba Tariq', 'sub5@nfctag.edu', 'Sub@123', 'active');

INSERT INTO nfctag_teachers (id, name, email, password, subject, status, created_by, created_by_name) VALUES
  ('c3333333-3333-4333-8333-000000000001', 'Ahmed Raza', 'ahmed.raza@nfctag.edu', 'Teacher@11', 'Mathematics', 'active', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('c3333333-3333-4333-8333-000000000002', 'Sara Malik', 'sara.malik@nfctag.edu', 'Teacher@22', 'English', 'active', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('c3333333-3333-4333-8333-000000000003', 'Usman Iqbal', 'usman.iqbal@nfctag.edu', 'Teacher@33', 'Science', 'active', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('c3333333-3333-4333-8333-000000000004', 'Fatima Zahra', 'fatima.zahra@nfctag.edu', 'Teacher@44', 'Urdu', 'active', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('c3333333-3333-4333-8333-000000000005', 'Bilal Hussain', 'bilal.hussain@nfctag.edu', 'Teacher@55', 'Computer', 'active', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam');

INSERT INTO nfctag_grades (id, name, created_by, created_by_name) VALUES
  ('d4444444-4444-4444-8444-000000000001', 'Grade 1', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('d4444444-4444-4444-8444-000000000002', 'Grade 2', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('d4444444-4444-4444-8444-000000000003', 'Grade 3', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('d4444444-4444-4444-8444-000000000004', 'Grade 4', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('d4444444-4444-4444-8444-000000000005', 'Grade 5', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam');

INSERT INTO nfctag_sections (id, grade_id, name, created_by, created_by_name) VALUES
  ('e5555555-5555-4555-8555-000000000001', 'd4444444-4444-4444-8444-000000000001', 'A', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('e5555555-5555-4555-8555-000000000002', 'd4444444-4444-4444-8444-000000000002', 'A', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('e5555555-5555-4555-8555-000000000003', 'd4444444-4444-4444-8444-000000000003', 'A', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('e5555555-5555-4555-8555-000000000004', 'd4444444-4444-4444-8444-000000000004', 'A', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('e5555555-5555-4555-8555-000000000005', 'd4444444-4444-4444-8444-000000000005', 'A', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam');

INSERT INTO nfctag_students (
  id, grade_id, section_id, name, age, gender, dob, nic, roll_no, blood_group, address,
  parent_name, parent_phone, parent_email, emergency_phone, notes, photo, created_by, created_by_name
) VALUES
  ('f6666666-6666-4666-8666-000000000001', 'd4444444-4444-4444-8444-000000000001', 'e5555555-5555-4555-8555-000000000001', 'Hassan Khan', '6', 'Boy', '2019-03-12', '35202-1000001-1', '01', 'B+', 'Model Town, Lahore', 'Asif Khan', '0300-1000001', '', '0301-1000001', '', '', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('f6666666-6666-4666-8666-000000000002', 'd4444444-4444-4444-8444-000000000002', 'e5555555-5555-4555-8555-000000000002', 'Zara Sheikh', '7', 'Girl', '2018-06-21', '35202-1000002-2', '01', 'A+', 'Johar Town, Lahore', 'Nadia Sheikh', '0300-1000002', '', '', '', '', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('f6666666-6666-4666-8666-000000000003', 'd4444444-4444-4444-8444-000000000003', 'e5555555-5555-4555-8555-000000000003', 'Bilal Ahmed', '8', 'Boy', '2017-11-02', '35202-1000003-3', '01', 'O+', 'Garden Town, Lahore', 'Omar Ahmed', '0300-1000003', '', '', '', '', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('f6666666-6666-4666-8666-000000000004', 'd4444444-4444-4444-8444-000000000004', 'e5555555-5555-4555-8555-000000000004', 'Maha Noor', '9', 'Girl', '2016-01-19', '35202-1000004-4', '01', 'AB+', 'DHA, Lahore', 'Saba Noor', '0300-1000004', '', '', '', '', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('f6666666-6666-4666-8666-000000000005', 'd4444444-4444-4444-8444-000000000005', 'e5555555-5555-4555-8555-000000000005', 'Usman Raza', '10', 'Boy', '2015-08-08', '35202-1000005-5', '01', 'B-', 'Cantt, Lahore', 'Faisal Raza', '0300-1000005', '', '', '', '', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam');

INSERT INTO nfctag_assignments (id, teacher_id, grade_id, section_id, hidden, created_by, created_by_name) VALUES
  ('aa777777-7777-4777-8777-000000000001', 'c3333333-3333-4333-8333-000000000001', 'd4444444-4444-4444-8444-000000000001', 'e5555555-5555-4555-8555-000000000001', false, 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('aa777777-7777-4777-8777-000000000002', 'c3333333-3333-4333-8333-000000000002', 'd4444444-4444-4444-8444-000000000002', 'e5555555-5555-4555-8555-000000000002', false, 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('aa777777-7777-4777-8777-000000000003', 'c3333333-3333-4333-8333-000000000003', 'd4444444-4444-4444-8444-000000000003', 'e5555555-5555-4555-8555-000000000003', false, 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('aa777777-7777-4777-8777-000000000004', 'c3333333-3333-4333-8333-000000000004', 'd4444444-4444-4444-8444-000000000004', 'e5555555-5555-4555-8555-000000000004', false, 'a1111111-1111-4111-8111-000000000001', 'Principal Madam'),
  ('aa777777-7777-4777-8777-000000000005', 'c3333333-3333-4333-8333-000000000005', 'd4444444-4444-4444-8444-000000000005', 'e5555555-5555-4555-8555-000000000005', false, 'a1111111-1111-4111-8111-000000000001', 'Principal Madam');

INSERT INTO nfctag_attendance (id, attend_date, grade_id, section_id, teacher_id, teacher_name, marks) VALUES
  ('bb888888-8888-4888-8888-000000000001', '2026-09-07', 'd4444444-4444-4444-8444-000000000001', 'e5555555-5555-4555-8555-000000000001', 'c3333333-3333-4333-8333-000000000001', 'Ahmed Raza', '{"f6666666-6666-4666-8666-000000000001":"present"}'),
  ('bb888888-8888-4888-8888-000000000002', '2026-09-08', 'd4444444-4444-4444-8444-000000000002', 'e5555555-5555-4555-8555-000000000002', 'c3333333-3333-4333-8333-000000000002', 'Sara Malik', '{"f6666666-6666-4666-8666-000000000002":"absent"}'),
  ('bb888888-8888-4888-8888-000000000003', '2026-09-09', 'd4444444-4444-4444-8444-000000000003', 'e5555555-5555-4555-8555-000000000003', 'c3333333-3333-4333-8333-000000000003', 'Usman Iqbal', '{"f6666666-6666-4666-8666-000000000003":"half-leave"}'),
  ('bb888888-8888-4888-8888-000000000004', '2026-09-10', 'd4444444-4444-4444-8444-000000000004', 'e5555555-5555-4555-8555-000000000004', 'c3333333-3333-4333-8333-000000000004', 'Fatima Zahra', '{"f6666666-6666-4666-8666-000000000004":"full-leave"}'),
  ('bb888888-8888-4888-8888-000000000005', '2026-09-11', 'd4444444-4444-4444-8444-000000000005', 'e5555555-5555-4555-8555-000000000005', 'c3333333-3333-4333-8333-000000000005', 'Bilal Hussain', '{"f6666666-6666-4666-8666-000000000005":"medical-leave"}');

INSERT INTO nfctag_activities (id, actor_id, actor_name, actor_role, action, target_type, target_name, detail, at) VALUES
  ('cc999999-9999-4999-8999-000000000001', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam', 'madam', 'created', 'teacher', 'Ahmed Raza', 'Created teacher login', now() - interval '5 days'),
  ('cc999999-9999-4999-8999-000000000002', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam', 'madam', 'created', 'class', 'Grade 1 Section A', 'Created class card', now() - interval '4 days'),
  ('cc999999-9999-4999-8999-000000000003', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam', 'madam', 'created', 'student', 'Hassan Khan', 'Added student', now() - interval '3 days'),
  ('cc999999-9999-4999-8999-000000000004', 'a1111111-1111-4111-8111-000000000001', 'Principal Madam', 'madam', 'assigned', 'class', 'Grade 1 Section A', 'Assigned to Ahmed Raza', now() - interval '2 days'),
  ('cc999999-9999-4999-8999-000000000005', 'c3333333-3333-4333-8333-000000000001', 'Ahmed Raza', 'teacher', 'updated', 'attendance', 'Grade 1 Section A', 'Saved attendance', now() - interval '1 day');
