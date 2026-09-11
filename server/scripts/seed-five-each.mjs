/**
 * Seed exactly 5 rows into every nfctag_* table for client testing.
 * Login pages stay clean — credentials printed here only.
 */
import { randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  (await readFile(path.join(root, '.env'), 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const eq = line.indexOf('=')
      return [line.slice(0, eq).trim(), line.slice(eq + 1).trim()]
    }),
)

const uid = () => randomUUID()

function tagCode() {
  return randomBytes(6).toString('hex').toUpperCase()
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const tables = (
  await client.query(`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public' AND tablename LIKE 'nfctag_%'
  ORDER BY tablename
`)
).rows.map((r) => r.tablename)

await client.query('BEGIN')
try {
  if (tables.length) {
    await client.query(`TRUNCATE TABLE ${tables.map((n) => `"${n}"`).join(', ')} RESTART IDENTITY CASCADE`)
  }

  const madamIds = Array.from({ length: 5 }, uid)
  const subIds = Array.from({ length: 5 }, uid)
  const teacherIds = Array.from({ length: 5 }, uid)
  const gradeIds = Array.from({ length: 5 }, uid)
  const sectionIds = Array.from({ length: 5 }, uid)
  const studentIds = Array.from({ length: 5 }, uid)
  const assignIds = Array.from({ length: 5 }, uid)
  const attendIds = Array.from({ length: 5 }, uid)
  const activityIds = Array.from({ length: 5 }, uid)
  const groupIds = Array.from({ length: 5 }, uid)
  const msgIds = Array.from({ length: 5 }, uid)
  const announceIds = Array.from({ length: 5 }, uid)
  const threadIds = Array.from({ length: 5 }, uid)
  const dmMsgIds = Array.from({ length: 5 }, uid)
  const dayIds = Array.from({ length: 5 }, uid)
  const tLeaveIds = Array.from({ length: 5 }, uid)
  const notifIds = Array.from({ length: 5 }, uid)
  const sLeaveIds = Array.from({ length: 5 }, uid)
  const studentTags = Array.from({ length: 5 }, tagCode)

  const madams = [
    ['Principal Madam', 'madam@nfctag.edu', 'Madam@Test1'],
    ['Madam Sana', 'madam2@nfctag.edu', 'Madam@Test2'],
    ['Madam Hina', 'madam3@nfctag.edu', 'Madam@Test3'],
    ['Madam Rabia', 'madam4@nfctag.edu', 'Madam@Test4'],
    ['Madam Iqra', 'madam5@nfctag.edu', 'Madam@Test5'],
  ]
  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_madam (id, name, email, password) VALUES ($1,$2,$3,$4)`,
      [madamIds[i], madams[i][0], madams[i][1], madams[i][2]],
    )
  }

  const subs = [
    ['Ayesha Khan', 'sub1@nfctag.edu', 'Sub@Test1'],
    ['Omar Sheikh', 'sub2@nfctag.edu', 'Sub@Test2'],
    ['Nida Farooq', 'sub3@nfctag.edu', 'Sub@Test3'],
    ['Hamza Ali', 'sub4@nfctag.edu', 'Sub@Test4'],
    ['Saba Tariq', 'sub5@nfctag.edu', 'Sub@Test5'],
  ]
  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_sub_users (id, name, email, password, status) VALUES ($1,$2,$3,$4,'active')`,
      [subIds[i], subs[i][0], subs[i][1], subs[i][2]],
    )
  }

  const teachers = [
    ['Ahmed Raza', 'teacher@nfctag.edu', 'Teacher@Test1', 'Mathematics'],
    ['Sara Malik', 'teacher2@nfctag.edu', 'Teacher@Test2', 'English'],
    ['Usman Iqbal', 'teacher3@nfctag.edu', 'Teacher@Test3', 'Science'],
    ['Fatima Zahra', 'teacher4@nfctag.edu', 'Teacher@Test4', 'Urdu'],
    ['Bilal Hussain', 'teacher5@nfctag.edu', 'Teacher@Test5', 'Computer'],
  ]
  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_teachers (id, name, email, password, subject, status, created_by, created_by_name)
       VALUES ($1,$2,$3,$4,$5,'active',$6,'Principal Madam')`,
      [teacherIds[i], teachers[i][0], teachers[i][1], teachers[i][2], teachers[i][3], madamIds[0]],
    )
  }

  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_grades (id, name, created_by, created_by_name) VALUES ($1,$2,$3,'Principal Madam')`,
      [gradeIds[i], `Grade ${i + 1}`, madamIds[0]],
    )
    await client.query(
      `INSERT INTO nfctag_sections (id, grade_id, name, created_by, created_by_name)
       VALUES ($1,$2,'A',$3,'Principal Madam')`,
      [sectionIds[i], gradeIds[i], madamIds[0]],
    )
  }

  const students = [
    ['Test Student', 'student@student.nfctag.edu', 'Student@Test1', 'Boy', 'Kamran Parent'],
    ['Areeba Shahid', 'student2@student.nfctag.edu', 'Student@Test2', 'Girl', 'Shahid Parent'],
    ['Hassan Khan', 'student3@student.nfctag.edu', 'Student@Test3', 'Boy', 'Asif Parent'],
    ['Zara Sheikh', 'student4@student.nfctag.edu', 'Student@Test4', 'Girl', 'Nadia Parent'],
    ['Bilal Ahmed', 'student5@student.nfctag.edu', 'Student@Test5', 'Boy', 'Omar Parent'],
  ]
  const bloods = ['O+', 'A+', 'B+', 'AB+', 'O-']
  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_students (
         id, grade_id, section_id, name, age, gender, roll_no, blood_group,
         parent_name, parent_phone, emergency_phone, allergies, notes,
         login_email, password, tag_code, created_by, created_by_name
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,
         $9,$10,$11,$12,$13,
         $14,$15,$16,$17,'Principal Madam'
       )`,
      [
        studentIds[i],
        gradeIds[i],
        sectionIds[i],
        students[i][0],
        String(6 + i),
        students[i][3],
        String(i + 1).padStart(2, '0'),
        bloods[i],
        students[i][4],
        `0300-100000${i + 1}`,
        `0321-200000${i + 1}`,
        i % 2 ? 'Peanuts' : 'None known',
        'Seeded test student',
        students[i][1],
        students[i][2],
        studentTags[i],
        madamIds[0],
      ],
    )
  }

  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_assignments (id, teacher_id, grade_id, section_id, hidden, created_by, created_by_name)
       VALUES ($1,$2,$3,$4,false,$5,'Principal Madam')`,
      [assignIds[i], teacherIds[i], gradeIds[i], sectionIds[i], madamIds[0]],
    )
  }

  const statuses = ['present', 'absent', 'half-leave', 'full-leave', 'medical-leave']
  for (let i = 0; i < 5; i += 1) {
    const day = `2026-09-${String(7 + i).padStart(2, '0')}`
    const marks = JSON.stringify({ [studentIds[i]]: statuses[i] })
    await client.query(
      `INSERT INTO nfctag_attendance (id, attend_date, grade_id, section_id, teacher_id, teacher_name, marks)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [attendIds[i], day, gradeIds[i], sectionIds[i], teacherIds[i], teachers[i][0], marks],
    )
  }

  const actions = ['created', 'updated', 'assigned', 'approved', 'posted']
  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_activities (id, actor_id, actor_name, actor_role, action, target_type, target_name, detail)
       VALUES ($1,$2,'Principal Madam','madam',$3,'student',$4,$5)`,
      [activityIds[i], madamIds[0], actions[i], students[i][0], `Seed activity ${i + 1}`],
    )
  }

  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_groups (id, name, scope, grade_id, section_id, created_by, created_by_name, created_by_role)
       VALUES ($1,$2,'section',$3,$4,$5,'Principal Madam','madam')`,
      [groupIds[i], `Grade ${i + 1} Section A`, gradeIds[i], sectionIds[i], madamIds[0]],
    )
    await client.query(
      `INSERT INTO nfctag_group_messages (id, group_id, author_id, author_name, author_role, body)
       VALUES ($1,$2,$3,$4,'teacher',$5)`,
      [msgIds[i], groupIds[i], teacherIds[i], teachers[i][0], `Welcome message for Grade ${i + 1}.`],
    )
    await client.query(
      `INSERT INTO nfctag_announcements (id, title, body, author_id, author_name, author_role)
       VALUES ($1,$2,$3,$4,'Principal Madam','madam')`,
      [announceIds[i], `Announcement ${i + 1}`, `School notice number ${i + 1} for testing.`, madamIds[0]],
    )
  }

  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_dm_threads (id, staff_id, staff_role, student_id, last_message_at)
       VALUES ($1,$2,'teacher',$3,now())`,
      [threadIds[i], teacherIds[i], studentIds[i]],
    )
    await client.query(
      `INSERT INTO nfctag_dm_messages (id, thread_id, author_id, author_name, author_role, body)
       VALUES ($1,$2,$3,$4,'teacher',$5)`,
      [dmMsgIds[i], threadIds[i], teacherIds[i], teachers[i][0], `Private note ${i + 1} for ${students[i][0]}.`],
    )
  }

  for (let i = 0; i < 5; i += 1) {
    const day = `2026-09-${String(7 + i).padStart(2, '0')}`
    await client.query(
      `INSERT INTO nfctag_teacher_days (id, teacher_id, teacher_name, work_date, check_in_at, check_out_at)
       VALUES ($1,$2,$3,$4, $5::timestamptz, $6::timestamptz)`,
      [
        dayIds[i],
        teacherIds[i],
        teachers[i][0],
        day,
        `${day}T08:00:00Z`,
        `${day}T14:00:00Z`,
      ],
    )
    await client.query(
      `INSERT INTO nfctag_teacher_leaves (id, teacher_id, teacher_name, start_date, end_date, reason, status, reviewed_by, reviewed_by_name)
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7,'Principal Madam')`,
      [
        tLeaveIds[i],
        teacherIds[i],
        teachers[i][0],
        `2026-10-${String(i + 1).padStart(2, '0')}`,
        `Personal leave ${i + 1}`,
        i % 2 ? 'approved' : 'pending',
        madamIds[0],
      ],
    )
    await client.query(
      `INSERT INTO nfctag_notifications (id, user_id, role, title, body, kind)
       VALUES ($1,$2,'teacher',$3,$4,'system')`,
      [notifIds[i], teacherIds[i], `Notice ${i + 1}`, `Test notification ${i + 1}`],
    )
  }

  const leaveTypes = ['restroom', 'clinic', 'library', 'administration', 'other']
  const leaveStatus = ['pending', 'approved', 'rejected', 'returned', 'approved']
  for (let i = 0; i < 5; i += 1) {
    await client.query(
      `INSERT INTO nfctag_student_leaves (
         id, student_id, student_name, grade_id, section_id, grade_name, section_name,
         leave_type, note, status, reviewed_by, reviewed_by_name, reviewed_by_role
       ) VALUES ($1,$2,$3,$4,$5,$6,'A',$7,$8,$9,$10,'Principal Madam','madam')`,
      [
        sLeaveIds[i],
        studentIds[i],
        students[i][0],
        gradeIds[i],
        sectionIds[i],
        `Grade ${i + 1}`,
        leaveTypes[i],
        `Leave note ${i + 1}`,
        leaveStatus[i],
        madamIds[0],
      ],
    )
  }

  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
}

const counts = {}
for (const name of tables) {
  const r = await client.query(`SELECT count(*)::int AS n FROM "${name}"`)
  counts[name] = r.rows[0].n
}

const publicBase = (env.PUBLIC_TAG_BASE || 'https://nfc-students.vercel.app').replace(/\/$/, '')
const firstStudent = await client.query(
  `SELECT name, login_email, password, tag_code FROM nfctag_students ORDER BY name LIMIT 5`,
)

console.log('Seeded 5 records per table:')
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`)
console.log('')
console.log('Primary test logins:')
console.log('  Madam:   madam@nfctag.edu / Madam@Test1')
console.log('  Teacher: teacher@nfctag.edu / Teacher@Test1')
console.log('  Student: student@student.nfctag.edu / Student@Test1')
console.log('')
console.log('All student QR links:')
for (const row of firstStudent.rows) {
  console.log(`  ${row.name}: ${publicBase}/c/${row.tag_code}  (${row.login_email} / ${row.password})`)
}

await client.end()
