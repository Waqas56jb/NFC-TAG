/**
 * Seed AMAN public + private demo data:
 * - allergies column
 * - rich public safety fields (parent, emergency, medical, allergy)
 * - student/parent portal logins (parents use child credentials)
 * - tag_code for each student (NFC public URL)
 */
import { randomBytes } from 'node:crypto'
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

const PUBLIC_BASE = (env.PUBLIC_TAG_BASE || 'https://nfc-students.vercel.app').replace(/\/$/, '')

function makeCode() {
  return randomBytes(6).toString('hex').toUpperCase()
}

function portrait(name, id) {
  const seed = encodeURIComponent(String(name || id || 'child'))
  return `https://api.dicebear.com/9.x/lorelei/png?seed=${seed}&size=256`
}

const SAMPLE = [
  {
    blood: 'O+',
    allergies: 'Peanuts, sesame',
    notes: 'Carries inhaler for mild asthma. Teacher keeps spare in clinic bag.',
    parentSuffix: ' (Father)',
  },
  {
    blood: 'A+',
    allergies: 'None known',
    notes: 'Wears glasses. Prefers left-side seating near board.',
    parentSuffix: ' (Mother)',
  },
  {
    blood: 'B+',
    allergies: 'Dairy (mild)',
    notes: 'Lactose intolerance — avoid milk snacks. Epinephrine not required.',
    parentSuffix: ' (Guardian)',
  },
  {
    blood: 'AB+',
    allergies: 'Bee stings',
    notes: 'Antihistamine in school bag. Call clinic on sting.',
    parentSuffix: ' (Father)',
  },
  {
    blood: 'O-',
    allergies: 'Dust mites',
    notes: 'Seasonal rhinitis. Keep away from chalk dust when possible.',
    parentSuffix: ' (Mother)',
  },
]

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(
  await readFile(path.join(root, 'supabase/migrations/20260911250000_nfctag_student_allergies.sql'), 'utf8'),
)
await client.query(
  await readFile(path.join(root, 'supabase/migrations/20260911240000_nfctag_student_tag_code.sql'), 'utf8'),
)

const { rows: students } = await client.query(`
  SELECT id, name, parent_name, parent_phone, parent_email, emergency_phone,
         blood_group, allergies, notes, photo, login_email, password, tag_code
  FROM nfctag_students
  ORDER BY name
`)

const usedEmails = new Set(
  students.map((s) => String(s.login_email || '').toLowerCase()).filter(Boolean),
)

let i = 0
for (const row of students) {
  const sample = SAMPLE[i % SAMPLE.length]
  i += 1

  const base = String(row.name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'student'
  let email = row.login_email || `${base}@student.nfctag.edu`
  if (!row.login_email) {
    let n = 2
    while (usedEmails.has(email.toLowerCase())) {
      email = `${base}${n}@student.nfctag.edu`
      n += 1
    }
  }
  usedEmails.add(email.toLowerCase())

  const parentGiven = String(row.name || 'Child').split(/\s+/)[0] || 'Child'
  const parentName = row.parent_name || `${parentGiven}'s parent${sample.parentSuffix}`
  const phoneTail = String(1000000 + (i * 137) % 8999999).padStart(7, '0')
  const parentPhone = row.parent_phone || `0300-${phoneTail.slice(0, 7)}`
  const emergencyPhone = row.emergency_phone || `0321-${phoneTail.slice(0, 7)}`
  const parentEmail = row.parent_email || `parent.${base}@mail.example`

  let tagCode = row.tag_code
  if (!tagCode) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      tagCode = makeCode()
      try {
        await client.query(`UPDATE nfctag_students SET tag_code = $1 WHERE id = $2 AND tag_code IS NULL`, [
          tagCode,
          row.id,
        ])
        break
      } catch (err) {
        if (err.code !== '23505' || attempt === 7) throw err
        tagCode = null
      }
    }
  }

  await client.query(
    `UPDATE nfctag_students SET
      login_email = COALESCE(NULLIF(login_email, ''), $2),
      password = COALESCE(NULLIF(password, ''), 'Student@11'),
      parent_name = COALESCE(NULLIF(parent_name, ''), $3),
      parent_phone = COALESCE(NULLIF(parent_phone, ''), $4),
      parent_email = COALESCE(NULLIF(parent_email, ''), $5),
      emergency_phone = COALESCE(NULLIF(emergency_phone, ''), $6),
      blood_group = COALESCE(NULLIF(blood_group, ''), $7),
      allergies = COALESCE(NULLIF(allergies, ''), $8),
      notes = COALESCE(NULLIF(notes, ''), $9),
      photo = COALESCE(NULLIF(photo, ''), $10),
      updated_at = now()
     WHERE id = $1`,
    [
      row.id,
      email,
      parentName,
      parentPhone,
      parentEmail,
      emergencyPhone,
      sample.blood,
      sample.allergies,
      sample.notes,
      portrait(row.name, row.id),
    ],
  )
}

await client.query("NOTIFY pgrst, 'reload schema'")

const demo = await client.query(`
  SELECT name, login_email, password, tag_code, parent_name, parent_phone, blood_group, allergies
  FROM nfctag_students
  WHERE login_email IS NOT NULL AND tag_code IS NOT NULL
  ORDER BY name
  LIMIT 5
`)

console.log('AMAN public + private seed ready.')
console.log('')
console.log('Public NFC scan URLs (no login):')
for (const row of demo.rows) {
  console.log(`  ${row.name}: ${PUBLIC_BASE}/c/${row.tag_code}`)
}
console.log('')
console.log('Parent / child private portal logins:')
for (const row of demo.rows) {
  console.log(`  ${row.name}: ${row.login_email} / ${row.password}`)
  console.log(`    Public: parent ${row.parent_name} · ${row.parent_phone} · ${row.blood_group} · ${row.allergies}`)
}

await client.end()
