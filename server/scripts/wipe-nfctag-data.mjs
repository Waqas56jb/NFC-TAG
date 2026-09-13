/**
 * Wipe ALL nfctag_* demo/seed rows. Schema stays.
 * Leaves one real Madam login so the panel can open empty.
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

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

const tables = await client.query(`
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename LIKE 'nfctag_%'
  ORDER BY tablename
`)

const names = tables.rows.map((r) => r.tablename)
if (!names.length) {
  console.log('No nfctag_* tables found.')
  await client.end()
  process.exit(0)
}

console.log('Wiping tables:', names.join(', '))

await client.query('BEGIN')
try {
  // CASCADE clears dependent FKs in one shot
  await client.query(`TRUNCATE TABLE ${names.map((n) => `"${n}"`).join(', ')} RESTART IDENTITY CASCADE`)

  // Single Principal account for empty real start
  await client.query(
    `INSERT INTO nfctag_madam (name, email, password)
     VALUES ($1, $2, $3)`,
    ['Principal', 'principal', 'Principal1'],
  )

  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
}

const counts = {}
for (const name of names) {
  const r = await client.query(`SELECT count(*)::int AS n FROM "${name}"`)
  counts[name] = r.rows[0].n
}

console.log('Wipe complete. Row counts:')
for (const [k, v] of Object.entries(counts)) {
  console.log(`  ${k}: ${v}`)
}
console.log('')
console.log('Principal login (empty school): principal / Principal1')
console.log('Add real classes, teachers, and students from Administration.')

await client.end()
