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

function makeCode() {
  const digits = '23456789'
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const pick = (set) => set[Math.floor(Math.random() * set.length)]
  return pick(digits) + pick(digits) + pick(letters) + pick(letters) + pick(letters) + pick(digits) + pick(digits)
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(
  await readFile(path.join(root, 'supabase/migrations/20260911240000_nfctag_student_tag_code.sql'), 'utf8'),
)

const { rows } = await client.query(`SELECT id FROM nfctag_students WHERE tag_code IS NULL`)
for (const row of rows) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeCode()
    try {
      await client.query(`UPDATE nfctag_students SET tag_code = $1 WHERE id = $2 AND tag_code IS NULL`, [code, row.id])
      break
    } catch (err) {
      if (err.code !== '23505' || attempt === 7) throw err
    }
  }
}

// Deduplicate any existing colliding tag_codes
const { rows: dups } = await client.query(`
  SELECT id
  FROM (
    SELECT id, tag_code,
      row_number() OVER (PARTITION BY tag_code ORDER BY created_at NULLS LAST, id) AS rn
    FROM nfctag_students
    WHERE tag_code IS NOT NULL
  ) x
  WHERE rn > 1
`)
for (const row of dups) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeCode()
    try {
      await client.query(`UPDATE nfctag_students SET tag_code = $1 WHERE id = $2`, [code, row.id])
      break
    } catch (err) {
      if (err.code !== '23505' || attempt === 7) throw err
    }
  }
}

const check = await client.query(`
  SELECT count(*)::int AS missing FROM nfctag_students WHERE tag_code IS NULL
`)
console.log(`Student tag_code ready. Missing: ${check.rows[0].missing}`)
await client.end()
