/**
 * Rename display name "Principal Madam" → "Principal"
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

const r1 = await client.query(
  `UPDATE nfctag_madam SET name = 'Principal' WHERE name ILIKE '%madam%' OR name = 'Principal Madam'`,
)
const r2 = await client.query(
  `UPDATE nfctag_student_leaves SET reviewed_by_name = 'Principal' WHERE reviewed_by_name ILIKE '%madam%'`,
)
console.log(`Madam rows renamed: ${r1.rowCount}. Leave reviewer labels fixed: ${r2.rowCount}.`)
await client.end()
