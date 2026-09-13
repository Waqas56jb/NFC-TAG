/**
 * Create / refresh one Principal + one Teacher + one Student for client testing.
 * Uses username + password (stored in email / login_email columns).
 */
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
  const digits = '23456789'
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const pick = (set) => set[Math.floor(Math.random() * set.length)]
  return pick(digits) + pick(digits) + pick(letters) + pick(letters) + pick(letters) + pick(digits) + pick(digits)
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
await client.query('BEGIN')

try {
  let madam = await client.query(`SELECT id, email FROM nfctag_madam WHERE email = $1 LIMIT 1`, ['principal'])
  if (!madam.rows[0]) {
    // Migrate legacy email login if present
    madam = await client.query(`SELECT id, email FROM nfctag_madam WHERE email = $1 LIMIT 1`, [
      'madam@nfctag.edu',
    ])
  }
  if (!madam.rows[0]) {
    madam = await client.query(
      `INSERT INTO nfctag_madam (name, email, password)
       VALUES ('Principal', 'principal', 'Principal1')
       RETURNING id, email`,
    )
  } else {
    await client.query(`UPDATE nfctag_madam SET name = $2, email = $3, password = $4 WHERE id = $1`, [
      madam.rows[0].id,
      'Principal',
      'principal',
      'Principal1',
    ])
  }
  const madamId = madam.rows[0].id

  let grade = await client.query(`SELECT id FROM nfctag_grades WHERE name = 'Grade 1' LIMIT 1`)
  if (!grade.rows[0]) {
    grade = await client.query(
      `INSERT INTO nfctag_grades (name, created_by, created_by_name)
       VALUES ('Grade 1', $1, 'Principal') RETURNING id`,
      [madamId],
    )
  }
  const gradeId = grade.rows[0].id

  let section = await client.query(
    `SELECT id FROM nfctag_sections WHERE grade_id = $1 AND name IN ('A', 'Section A') LIMIT 1`,
    [gradeId],
  )
  if (!section.rows[0]) {
    section = await client.query(
      `INSERT INTO nfctag_sections (grade_id, name, created_by, created_by_name)
       VALUES ($1, 'Section A', $2, 'Principal') RETURNING id`,
      [gradeId, madamId],
    )
  }
  const sectionId = section.rows[0].id

  let teacher = await client.query(`SELECT id FROM nfctag_teachers WHERE email IN ('teacher', 'teacher@nfctag.edu') LIMIT 1`)
  if (!teacher.rows[0]) {
    teacher = await client.query(
      `INSERT INTO nfctag_teachers (name, email, password, subject, status, created_by, created_by_name)
       VALUES ('Test Teacher', 'teacher', 'Teacher1', 'General', 'active', $1, 'Principal')
       RETURNING id`,
      [madamId],
    )
  } else {
    await client.query(
      `UPDATE nfctag_teachers SET name = 'Test Teacher', email = 'teacher', password = 'Teacher1', status = 'active' WHERE id = $1`,
      [teacher.rows[0].id],
    )
  }
  const teacherId = teacher.rows[0].id

  await client.query(
    `INSERT INTO nfctag_assignments (teacher_id, grade_id, section_id, hidden, created_by, created_by_name)
     SELECT $1, $2, $3, false, $4, 'Principal'
     WHERE NOT EXISTS (
       SELECT 1 FROM nfctag_assignments WHERE teacher_id = $1 AND grade_id = $2 AND section_id = $3
     )`,
    [teacherId, gradeId, sectionId, madamId],
  )

  let student = await client.query(
    `SELECT id, tag_code FROM nfctag_students WHERE login_email IN ('student', 'student@nfctag.edu', 'student@student.nfctag.edu') LIMIT 1`,
  )
  if (!student.rows[0]) {
    student = await client.query(
      `INSERT INTO nfctag_students (
         grade_id, section_id, name, age, gender, roll_no, blood_group,
         parent_name, parent_phone, emergency_phone, allergies, notes,
         login_email, password, tag_code, created_by, created_by_name
       ) VALUES (
         $1, $2, 'Test Student', '7', 'Boy', '01', 'O+',
         'Test Parent', '0300-1111111', '0300-2222222', 'None known', 'Test student for portal login.',
         'student', 'Student1', $3, $4, 'Principal'
       ) RETURNING id, tag_code`,
      [gradeId, sectionId, tagCode(), madamId],
    )
  } else {
    const code = student.rows[0].tag_code || tagCode()
    await client.query(
      `UPDATE nfctag_students SET
         name = 'Test Student',
         login_email = 'student',
         password = 'Student1',
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
  console.log('Test accounts ready (username / password):')
  console.log('')
  console.log('  Principal: principal / Principal1')
  console.log('  Teacher:   teacher / Teacher1')
  console.log('  Student:   student / Student1')
  console.log('')
  console.log(`  Student public QR URL: ${publicBase}/c/${student.rows[0].tag_code}`)
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  await client.end()
}
