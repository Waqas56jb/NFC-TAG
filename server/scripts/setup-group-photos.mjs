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
await client.query(await readFile(path.join(root, 'supabase/migrations/20260911210000_nfctag_group_photo.sql'), 'utf8'))

const groups = await client.query(`SELECT id, name FROM nfctag_groups WHERE photo IS NULL OR photo = ''`)
for (const row of groups.rows) {
  const seed = encodeURIComponent(row.name || row.id)
  const photo = `https://api.dicebear.com/9.x/shapes/png?seed=${seed}&size=256`
  await client.query(`UPDATE nfctag_groups SET photo = $2 WHERE id = $1 AND (photo IS NULL OR photo = '')`, [row.id, photo])
}

const students = await client.query(`SELECT id, name FROM nfctag_students WHERE photo IS NULL OR photo = ''`)
for (const row of students.rows) {
  const seed = encodeURIComponent(row.name || row.id)
  const photo = `https://api.dicebear.com/9.x/lorelei/png?seed=${seed}&size=256`
  await client.query(`UPDATE nfctag_students SET photo = $2 WHERE id = $1 AND (photo IS NULL OR photo = '')`, [row.id, photo])
}

console.log(`Group photo column ready. Seeded ${groups.rows.length} group avatars and ${students.rows.length} student portraits from DiceBear.`)
await client.end()
