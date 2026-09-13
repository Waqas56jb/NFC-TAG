/**
 * After wipe: create one Principal, one Teacher, one Student, Grade 1 / Section A.
 * Clean start accounts for login testing — not bulk demo seed.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { randomUUID } from 'node:crypto'

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

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

const madamId = randomUUID()
const teacherId = randomUUID()
const gradeId = randomUUID()
const sectionId = randomUUID()
const studentId = randomUUID()
const assignmentId = randomUUID()
const tagCode = 'AMAN01'

await client.query('BEGIN')
try {
  await client.query(`DELETE FROM nfctag_madam`)
  await client.query(
    `INSERT INTO nfctag_madam (id, name, email, password) VALUES ($1,$2,$3,$4)`,
    [madamId, 'Principal', 'madam@nfctag.edu', 'Madam@Test1'],
  )
  await client.query(
    `INSERT INTO nfctag_teachers (id, name, email, password, subject, status, created_by, created_by_name)
     VALUES ($1,$2,$3,$4,$5,'active',$6,$7)`,
    [teacherId, 'Ahmed Raza', 'teacher@nfctag.edu', 'Teacher@Test1', 'Mathematics', madamId, 'Principal'],
  )
  await client.query(`INSERT INTO nfctag_grades (id, name, created_by, created_by_name) VALUES ($1,$2,$3,$4)`, [
    gradeId,
    'Grade 1',
    madamId,
    'Principal',
  ])
  await client.query(
    `INSERT INTO nfctag_sections (id, grade_id, name, created_by, created_by_name) VALUES ($1,$2,$3,$4,$5)`,
    [sectionId, gradeId, 'Section A', madamId, 'Principal'],
  )
  await client.query(
    `INSERT INTO nfctag_assignments (id, teacher_id, grade_id, section_id, hidden, created_by, created_by_name)
     VALUES ($1,$2,$3,$4,false,$5,$6)`,
    [assignmentId, teacherId, gradeId, sectionId, madamId, 'Principal'],
  )
  await client.query(
    `INSERT INTO nfctag_students (
       id, name, age, gender, roll_no, blood_group, parent_name, parent_phone,
       grade_id, section_id, login_email, password, tag_code, notes, created_by, created_by_name
     ) VALUES (
       $1,'Test Student','6','Boy','01','O+','Kamran Parent','0300-1000001',
       $2,$3,'student@nfctag.edu','Student@Test1',$4,'Clean start student',$5,'Principal'
     )`,
    [studentId, gradeId, sectionId, tagCode, madamId],
  )
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
}

console.log('Clean accounts ready:')
console.log('  Principal: madam@nfctag.edu / Madam@Test1')
console.log('  Teacher:   teacher@nfctag.edu / Teacher@Test1')
console.log('  Student:   student@nfctag.edu / Student@Test1')
console.log(`  NFC tag:   ${tagCode}`)
await client.end()
