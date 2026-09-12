/**
 * Reassign every student an elegant NFC tag like 12FHE42.
 * Run: node scripts/reassign-elegant-tags.mjs
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

const TAG_DIGITS = '23456789'
const TAG_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'

function pick(alphabet) {
  return alphabet[Math.floor(Math.random() * alphabet.length)]
}

function isUgly(code) {
  const c = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (c.length !== 7) return true
  if (!/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{7}$/.test(c)) return true
  if (/(.)\1{2,}/.test(c)) return true
  const counts = {}
  for (const ch of c) counts[ch] = (counts[ch] || 0) + 1
  if (Math.max(...Object.values(counts)) >= 4) return true
  return false
}

function makeCode() {
  for (let i = 0; i < 48; i += 1) {
    const code =
      pick(TAG_DIGITS) +
      pick(TAG_DIGITS) +
      pick(TAG_LETTERS) +
      pick(TAG_LETTERS) +
      pick(TAG_LETTERS) +
      pick(TAG_DIGITS) +
      pick(TAG_DIGITS)
    if (!isUgly(code)) return code
  }
  return (
    pick(TAG_DIGITS) +
    pick(TAG_LETTERS) +
    pick(TAG_DIGITS) +
    pick(TAG_LETTERS) +
    pick(TAG_DIGITS) +
    pick(TAG_LETTERS) +
    pick(TAG_DIGITS)
  )
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(
  await readFile(path.join(root, 'supabase/migrations/20260911240000_nfctag_student_tag_code.sql'), 'utf8'),
)

const { rows } = await client.query(`SELECT id, name, tag_code FROM nfctag_students ORDER BY created_at NULLS LAST, id`)
let updated = 0
const samples = []

for (const row of rows) {
  if (row.tag_code && !isUgly(row.tag_code)) {
    if (samples.length < 8) samples.push({ name: row.name, tag: row.tag_code, kept: true })
    continue
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = makeCode()
    try {
      await client.query(`UPDATE nfctag_students SET tag_code = $1 WHERE id = $2`, [code, row.id])
      updated += 1
      if (samples.length < 12) samples.push({ name: row.name, tag: code, kept: false })
      break
    } catch (err) {
      if (err.code !== '23505' || attempt === 11) throw err
    }
  }
}

const publicBase = (env.PUBLIC_TAG_BASE || 'https://nfc-students.vercel.app').replace(/\/$/, '')
console.log(`Elegant tags ready. Checked ${rows.length} students, updated ${updated}.`)
for (const s of samples) {
  console.log(`  ${s.name}: ${publicBase}/c/${s.tag}${s.kept ? ' (kept)' : ''}`)
}
await client.end()
