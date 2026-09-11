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

function dateKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function pickStatus(studentId, date) {
  let h = 0
  const s = `${studentId}:${date}`
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const n = h % 100
  if (n < 8) return 'absent'
  if (n < 12) return 'half-leave'
  if (n < 15) return 'full-leave'
  if (n < 18) return 'medical-leave'
  return 'present'
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

const students = await client.query(
  'SELECT id, grade_id, section_id FROM nfctag_students ORDER BY created_at ASC',
)
const assignments = await client.query(
  'SELECT teacher_id, grade_id, section_id FROM nfctag_assignments WHERE hidden = false',
)
const teachers = await client.query('SELECT id, name FROM nfctag_teachers')
const teacherName = Object.fromEntries(teachers.rows.map((row) => [row.id, row.name]))

const byClass = new Map()
for (const student of students.rows) {
  const key = `${student.grade_id}:${student.section_id}`
  if (!byClass.has(key)) byClass.set(key, [])
  byClass.get(key).push(student.id)
}

const assignMap = new Map()
for (const row of assignments.rows) {
  assignMap.set(`${row.grade_id}:${row.section_id}`, row.teacher_id)
}

const start = new Date(2026, 2, 2)
const end = new Date(2026, 8, 10)
const rows = []

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const day = d.getDay()
  if (day === 0 || day === 6) continue
  const iso = dateKey(d)
  for (const [key, ids] of byClass.entries()) {
    const [gradeId, sectionId] = key.split(':')
    const teacherId = assignMap.get(key) || null
    const marks = {}
    ids.forEach((id) => {
      marks[id] = pickStatus(id, iso)
    })
    rows.push({
      attend_date: iso,
      grade_id: gradeId,
      section_id: sectionId,
      teacher_id: teacherId,
      teacher_name: teacherName[teacherId] || 'Teacher',
      marks,
    })
  }
}

let inserted = 0
for (let i = 0; i < rows.length; i += 40) {
  const chunk = rows.slice(i, i + 40)
  const values = []
  const params = []
  chunk.forEach((row, idx) => {
    const n = idx * 6
    values.push(`($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5}, $${n + 6}::jsonb)`)
    params.push(row.attend_date, row.grade_id, row.section_id, row.teacher_id, row.teacher_name, JSON.stringify(row.marks))
  })
  const result = await client.query(
    `INSERT INTO nfctag_attendance (attend_date, grade_id, section_id, teacher_id, teacher_name, marks)
     VALUES ${values.join(',')}
     ON CONFLICT (attend_date, grade_id, section_id) DO NOTHING`,
    params,
  )
  inserted += result.rowCount
}

const count = await client.query('SELECT count(*)::int AS n FROM nfctag_attendance')
console.log(`Attendance history: tried ${rows.length}, inserted ${inserted}, total ${count.rows[0].n}`)
await client.end()
