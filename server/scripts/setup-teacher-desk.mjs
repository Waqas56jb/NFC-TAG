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
await client.query(await readFile(path.join(root, 'supabase/migrations/20260911196000_nfctag_teacher_desk.sql'), 'utf8'))
await client.query("NOTIFY pgrst, 'reload schema'")
const days = await client.query('SELECT count(*)::int AS n FROM nfctag_teacher_days')
const leaves = await client.query('SELECT count(*)::int AS n FROM nfctag_teacher_leaves')
console.log(`Teacher desk ready. Days: ${days.rows[0].n}. Leaves: ${leaves.rows[0].n}.`)
await client.end()
