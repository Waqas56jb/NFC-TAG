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
await client.query(
  await readFile(path.join(root, 'supabase/migrations/20260911173400_nfctag_five_students_per_section.sql'), 'utf8'),
)

const extras = [
  ['Ayan Malik', 'Boy'],
  ['Hoorain Ali', 'Girl'],
  ['Zain Abbas', 'Boy'],
  ['Meerab Fatima', 'Girl'],
  ['Haris Nadeem', 'Boy'],
]

const short = await client.query(`
  SELECT s.id AS section_id, s.grade_id, count(st.id)::int AS n
  FROM nfctag_sections s
  LEFT JOIN nfctag_students st ON st.section_id = s.id
  GROUP BY s.id, s.grade_id
  HAVING count(st.id) < 5
`)

for (const row of short.rows) {
  const need = 5 - row.n
  for (let i = 0; i < need; i++) {
    const person = extras[i % extras.length]
    await client.query(
      `INSERT INTO nfctag_students (
        grade_id, section_id, name, age, gender, roll_no, parent_name, parent_phone, created_by, created_by_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        row.grade_id,
        row.section_id,
        `${person[0]} ${row.n + i + 1}`,
        String(6 + i),
        person[1],
        String(row.n + i + 1).padStart(2, '0'),
        'Parent',
        `0300-20000${i}${row.n}`,
        'a1111111-1111-4111-8111-000000000001',
        'Principal Madam',
      ],
    )
  }
}

const counts = await client.query(`
  SELECT g.name AS grade, s.name AS section, count(st.id)::int AS students
  FROM nfctag_sections s
  JOIN nfctag_grades g ON g.id = s.grade_id
  LEFT JOIN nfctag_students st ON st.section_id = s.id
  GROUP BY g.name, s.name
  ORDER BY g.name, s.name
`)

console.log('Students per section:')
for (const row of counts.rows) console.log(`  ${row.grade} Section ${row.section}: ${row.students}`)

await client.end()
