/**
 * Strip "Madam" from display names / DM labels. Internal role code stays.
 * Run: node scripts/strip-madam-labels.mjs
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

function clean(name) {
  const n = String(name || '')
    .replace(/\bmadam\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return n || 'Principal'
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const madams = await client.query(`SELECT id, name FROM nfctag_madam`)
let n1 = 0
for (const row of madams.rows) {
  const next = clean(row.name)
  if (next !== row.name) {
    await client.query(`UPDATE nfctag_madam SET name = $1 WHERE id = $2`, [next, row.id])
    n1 += 1
  }
}

const threads = await client.query(
  `SELECT id, staff_name, staff_role FROM nfctag_dm_threads WHERE staff_name ILIKE '%madam%' OR staff_role = 'madam'`,
)
let n2 = 0
for (const row of threads.rows) {
  const next = row.staff_role === 'madam' ? clean(row.staff_name) || 'Principal' : clean(row.staff_name)
  await client.query(`UPDATE nfctag_dm_threads SET staff_name = $1 WHERE id = $2`, [next, row.id])
  n2 += 1
}

const msgs = await client.query(
  `SELECT id, author_name, author_role FROM nfctag_dm_messages WHERE author_name ILIKE '%madam%' OR author_role = 'madam'`,
)
let n3 = 0
for (const row of msgs.rows) {
  const next =
    row.author_role === 'madam' ? clean(row.author_name) || 'Principal' : clean(row.author_name)
  await client.query(`UPDATE nfctag_dm_messages SET author_name = $1 WHERE id = $2`, [next, row.id])
  n3 += 1
}

const gmsgs = await client.query(
  `SELECT id, author_name, author_role FROM nfctag_group_messages WHERE author_name ILIKE '%madam%' OR author_role = 'madam'`,
)
let n4 = 0
for (const row of gmsgs.rows) {
  const next =
    row.author_role === 'madam' ? clean(row.author_name) || 'Principal' : clean(row.author_name)
  await client.query(`UPDATE nfctag_group_messages SET author_name = $1 WHERE id = $2`, [next, row.id])
  n4 += 1
}

const anns = await client.query(
  `SELECT id, author_name, author_role FROM nfctag_announcements WHERE author_name ILIKE '%madam%' OR author_role = 'madam'`,
)
let n5 = 0
for (const row of anns.rows) {
  const next =
    row.author_role === 'madam' ? clean(row.author_name) || 'Principal' : clean(row.author_name)
  await client.query(`UPDATE nfctag_announcements SET author_name = $1 WHERE id = $2`, [next, row.id])
  n5 += 1
}

console.log(`Updated names: madam=${n1} dm_threads=${n2} dm_msgs=${n3} group_msgs=${n4} announces=${n5}`)
await client.end()
