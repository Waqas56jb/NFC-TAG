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

if (!env.SUPABASE_DB_URL) {
  console.error('Missing SUPABASE_DB_URL in server/.env')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(await readFile(path.join(root, 'supabase/migrations/20260912180000_nfctag_homework.sql'), 'utf8'))
await client.query(await readFile(path.join(root, 'supabase/migrations/20260913010000_nfctag_homework_course.sql'), 'utf8'))
const check = await client.query(
  `select column_name from information_schema.columns
   where table_schema = 'public' and table_name = 'nfctag_homework'
   order by ordinal_position`,
)
console.log('nfctag_homework ready. Columns:', check.rows.map((r) => r.column_name).join(', '))
await client.end()
