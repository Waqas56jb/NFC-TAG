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

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(await readFile(path.join(root, 'supabase/migrations/20260911184000_nfctag_groups_announce.sql'), 'utf8'))

const students = await client.query('SELECT id, name FROM nfctag_students ORDER BY name')
const used = new Set()
for (const row of students.rows) {
  const base = String(row.name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'student'
  let email = `${base}@student.nfctag.edu`
  let n = 2
  while (used.has(email)) {
    email = `${base}${n}@student.nfctag.edu`
    n += 1
  }
  used.add(email)
  await client.query(
    `UPDATE nfctag_students SET login_email = COALESCE(NULLIF(login_email, ''), $2), password = COALESCE(NULLIF(password, ''), 'Student@11') WHERE id = $1`,
    [row.id, email],
  )
}

const sections = await client.query(`
  SELECT s.id AS section_id, s.name AS section_name, g.id AS grade_id, g.name AS grade_name
  FROM nfctag_sections s
  JOIN nfctag_grades g ON g.id = s.grade_id
`)

for (const row of sections.rows) {
  await client.query(
    `INSERT INTO nfctag_groups (name, scope, grade_id, section_id, created_by_name, created_by_role)
     SELECT $1, 'section', $2, $3, 'Principal Madam', 'madam'
     WHERE NOT EXISTS (SELECT 1 FROM nfctag_groups WHERE section_id = $3)`,
    [`${row.grade_name} Section ${row.section_name}`, row.grade_id, row.section_id],
  )
}

const grades = await client.query('SELECT id, name FROM nfctag_grades')
for (const row of grades.rows) {
  await client.query(
    `INSERT INTO nfctag_groups (name, scope, grade_id, section_id, created_by_name, created_by_role)
     SELECT $1, 'grade', $2, NULL, 'Principal Madam', 'madam'
     WHERE NOT EXISTS (SELECT 1 FROM nfctag_groups WHERE grade_id = $2 AND section_id IS NULL)`,
    [`${row.name} · all sections`, row.id],
  )
}

const existing = await client.query('SELECT count(*)::int AS n FROM nfctag_announcements')
if (existing.rows[0].n === 0) {
  await client.query(
    `INSERT INTO nfctag_announcements (title, body, author_name, author_role)
     VALUES ($1, $2, 'Principal Madam', 'madam')`,
    [
      'Welcome to school groups',
      'Teachers can post notes, syllabus, photos, PDFs and Excel in each class group. Students can open the group and read announcements from the bell icon.',
    ],
  )
}

const demo = await client.query(
  `SELECT name, login_email, password FROM nfctag_students WHERE login_email IS NOT NULL ORDER BY name LIMIT 3`,
)
const gcount = await client.query('SELECT count(*)::int AS n FROM nfctag_groups')
console.log(`Groups ready: ${gcount.rows[0].n}`)
console.log('Student demo logins:')
for (const row of demo.rows) console.log(`  ${row.name}: ${row.login_email} / ${row.password}`)

await client.query("NOTIFY pgrst, 'reload schema'")
await client.end()
