import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
const sqlPath = path.join(root, 'supabase/migrations/20260911172400_nfctag_isolated_tables.sql')

function loadEnv(text) {
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnv(await readFile(envPath, 'utf8'))
const connectionString = env.SUPABASE_DB_URL
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL missing in .env')
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

const existing = await client.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name
`)

console.log('Existing tables (not modified):')
for (const row of existing.rows) {
  const mark = row.table_name.startsWith('nfctag_') ? ' [NFC-TAG]' : ''
  console.log(`  ${row.table_schema}.${row.table_name}${mark}`)
}

const sql = await readFile(sqlPath, 'utf8')
await client.query(sql)

const created = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE 'nfctag_%'
  ORDER BY table_name
`)

console.log('\nNFC-TAG tables ready:')
for (const row of created.rows) {
  console.log(`  public.${row.table_name}`)
}

await client.end()
