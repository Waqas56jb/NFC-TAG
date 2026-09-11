/**
 * Create one Madam + one Teacher + one Student for real testing.
 * Login pages must NOT show these — share privately.
 */
import { randomBytes } from 'node:crypto'
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

function tagCode() {
  return randomBytes(6).toString('hex').toUpperCase()
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
await client.query('BEGIN')

try {
  // Madam (upsert by email)
  let madam = await client.query(`SELECT id, email FROM nfctag_madam WHERE email = $1 LIMIT 1`, [
    'madam@nfctag.edu',
  ])
  if (!madam.rows[0]) {
    madam = await client.query(
      `INSERT INTO nfctag_madam (name, email, password)
       VALUES ('Principal Madam', 'madam@nfctag.edu', 'Madam@Test1')
       RETURNING id, email`,
    )
  } else {
    await client.query(`UPDATE nfctag_madam SET name = $2, password = $3 WHERE id = $1`, [
      madam.rows[0].id,
      'Principal Madam',
      'Madam@Test1',
    ])
  }
  const madamId = madam.rows[0].id

  // Grade + section
  let grade = await client.query(`SELECT id FROM nfctag_grades WHERE name = 'Grade 1' LIMIT 1`)
  if (!grade.rows[0]) {
    grade = await client.query(
      `INSERT INTO nfctag_grades (name, created_by, created_by_name)
       VALUES ('Grade 1', $1, 'Principal Madam') RETURNING id`,
      [madamId],
    )
  }
  const gradeId = grade.rows[0].id

  let section = await client.query(
    `SELECT id FROM nfctag_sections WHERE grade_id = $1 AND name = 'A' LIMIT 1`,
    [gradeId],
  )
  if (!section.rows[0]) {
    section = await client.query(
      `INSERT INTO nfctag_sections (grade_id, name, created_by, created_by_name)
       VALUES ($1, 'A', $2, 'Principal Madam') RETURNING id`,
      [gradeId, madamId],
    )
  }
  const sectionId = section.rows[0].id

  // Teacher
  let teacher = await client.query(`SELECT id FROM nfctag_teachers WHERE email = $1 LIMIT 1`, [
    'teacher@nfctag.edu',
  ])
  if (!teacher.rows[0]) {
    teacher = await client.query(
      `INSERT INTO nfctag_teachers (name, email, password, subject, status, created_by, created_by_name)
       VALUES ('Test Teacher', 'teacher@nfctag.edu', 'Teacher@Test1', 'General', 'active', $1, 'Principal Madam')
       RETURNING id`,
      [madamId],
    )
  } else {
    await client.query(
      `UPDATE nfctag_teachers SET name = 'Test Teacher', password = 'Teacher@Test1', status = 'active' WHERE id = $1`,
      [teacher.rows[0].id],
    )
  }
  const teacherId = teacher.rows[0].id

  // Assign teacher to Grade 1 A
  await client.query(
    `INSERT INTO nfctag_assignments (teacher_id, grade_id, section_id, hidden, created_by, created_by_name)
     SELECT $1, $2, $3, false, $4, 'Principal Madam'
     WHERE NOT EXISTS (
       SELECT 1 FROM nfctag_assignments WHERE teacher_id = $1 AND grade_id = $2 AND section_id = $3
     )`,
    [teacherId, gradeId, sectionId, madamId],
  )

  // Student
  const studentEmail = 'student@student.nfctag.edu'
  let student = await client.query(`SELECT id, tag_code FROM nfctag_students WHERE login_email = $1 LIMIT 1`, [
    studentEmail,
  ])
  if (!student.rows[0]) {
    student = await client.query(
      `INSERT INTO nfctag_students (
         grade_id, section_id, name, age, gender, roll_no, blood_group,
         parent_name, parent_phone, emergency_phone, allergies, notes,
         login_email, password, tag_code, created_by, created_by_name
       ) VALUES (
         $1, $2, 'Test Student', '7', 'Boy', '01', 'O+',
         'Test Parent', '0300-1111111', '0300-2222222', 'None known', 'Test student for portal login.',
         $3, 'Student@Test1', $4, $5, 'Principal Madam'
       ) RETURNING id, tag_code`,
      [gradeId, sectionId, studentEmail, tagCode(), madamId],
    )
  } else {
    const code = student.rows[0].tag_code || tagCode()
    await client.query(
      `UPDATE nfctag_students SET
         name = 'Test Student',
         password = 'Student@Test1',
         parent_name = COALESCE(NULLIF(parent_name, ''), 'Test Parent'),
         parent_phone = COALESCE(NULLIF(parent_phone, ''), '0300-1111111'),
         emergency_phone = COALESCE(NULLIF(emergency_phone, ''), '0300-2222222'),
         allergies = COALESCE(NULLIF(allergies, ''), 'None known'),
         tag_code = COALESCE(NULLIF(tag_code, ''), $2)
       WHERE id = $1`,
      [student.rows[0].id, code],
    )
    student = await client.query(`SELECT id, tag_code FROM nfctag_students WHERE id = $1`, [student.rows[0].id])
  }

  await client.query('COMMIT')

  const publicBase = (env.PUBLIC_TAG_BASE || 'https://nfc-students.vercel.app').replace(/\/$/, '')
  console.log('Test accounts ready (NOT shown on login pages):')
  console.log('')
  console.log('  Madam:   madam@nfctag.edu / Madam@Test1')
  console.log('  Teacher: teacher@nfctag.edu / Teacher@Test1')
  console.log('  Student: student@student.nfctag.edu / Student@Test1')
  console.log('')
  console.log(`  Student public QR URL: ${publicBase}/c/${student.rows[0].tag_code}`)
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  await client.end()
}
