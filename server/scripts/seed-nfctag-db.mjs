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
const sql = await readFile(
  path.join(root, 'supabase/migrations/20260911172600_nfctag_grants_and_seed.sql'),
  'utf8',
)
await client.query(sql)

const counts = await client.query(`
  SELECT 'nfctag_madam' AS t, count(*)::int AS n FROM nfctag_madam
  UNION ALL SELECT 'nfctag_sub_users', count(*)::int FROM nfctag_sub_users
  UNION ALL SELECT 'nfctag_teachers', count(*)::int FROM nfctag_teachers
  UNION ALL SELECT 'nfctag_grades', count(*)::int FROM nfctag_grades
  UNION ALL SELECT 'nfctag_sections', count(*)::int FROM nfctag_sections
  UNION ALL SELECT 'nfctag_students', count(*)::int FROM nfctag_students
  UNION ALL SELECT 'nfctag_assignments', count(*)::int FROM nfctag_assignments
  UNION ALL SELECT 'nfctag_attendance', count(*)::int FROM nfctag_attendance
  UNION ALL SELECT 'nfctag_activities', count(*)::int FROM nfctag_activities
  ORDER BY t
`)

console.log('NFC-TAG seed counts:')
for (const row of counts.rows) console.log(`  ${row.t}: ${row.n}`)

await client.query("NOTIFY pgrst, 'reload schema'")
await client.end()
