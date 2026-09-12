/** Unique public NFC profile URL helpers (no QR). */

/** Digits only — no 0/1 (look like O/I). */
const TAG_DIGITS = '23456789'
/** Letters only — no I/L/O (look like 1/0). */
const TAG_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'

function pick(alphabet) {
  return alphabet[Math.floor(Math.random() * alphabet.length)]
}

/** True for ugly codes: repeats, hex blobs, too long, all one char. */
export function isUglyTagCode(code) {
  const c = normalizeTagCode(code)
  if (!c) return true
  if (c.length !== 7) return true
  if (!/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{7}$/.test(c)) return true
  if (/(.)\1{2,}/.test(c)) return true
  const counts = {}
  for (const ch of c) counts[ch] = (counts[ch] || 0) + 1
  if (Math.max(...Object.values(counts)) >= 4) return true
  return false
}

export function normalizeTagCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * Elegant unique tag like 12FHE42 (DDLLLDD).
 * Avoids ambiguous characters and triple repeats.
 */
export function generateElegantTagCode() {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const code =
      pick(TAG_DIGITS) +
      pick(TAG_DIGITS) +
      pick(TAG_LETTERS) +
      pick(TAG_LETTERS) +
      pick(TAG_LETTERS) +
      pick(TAG_DIGITS) +
      pick(TAG_DIGITS)
    if (!isUglyTagCode(code)) return code
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

export function studentTagCode(student) {
  const raw = normalizeTagCode(student?.tagCode)
  if (raw && raw !== normalizeTagCode(student?.id)) return raw
  return ''
}

export function publicTagBase() {
  const fromEnv = (import.meta.env.VITE_PUBLIC_TAG_BASE || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname || ''
    if (host.includes('nfc-madem') || host.includes('nfc-teacher')) {
      return 'https://nfc-students.vercel.app'
    }
    return window.location.origin
  }
  return 'https://nfc-students.vercel.app'
}

export function studentPublicUrl(student) {
  const code = studentTagCode(student)
  if (!code) return ''
  return `${publicTagBase()}/c/${code}`
}

/** Copy unique NFC Web Link for NFC Tools → Web Link write. */
export async function copyStudentTagUrl(student) {
  const url = studentPublicUrl(student)
  if (!url) throw new Error('Student tag code missing.')
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  } else {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    input.remove()
  }
  return { ok: true, url, code: studentTagCode(student) }
}

export function extractTagCodeFromText(raw) {
  const text = String(raw || '').trim()
  const pathMatch = text.match(/\/c\/([A-Za-z0-9]{6,20})(?:[/?#]|$)/i)
  if (pathMatch) return normalizeTagCode(pathMatch[1])

  const compact = normalizeTagCode(text)
  if (/^[A-Z0-9]{7}$/.test(compact)) return compact
  if (/^[A-Z0-9]{6,16}$/.test(compact)) return compact

  const tokens = text
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  for (const token of tokens) {
    if (/^[A-Z0-9]{7,16}$/.test(token) && !/^(AMAN|OPEN|SCAN|CAMERA|CODE|THIS)$/.test(token)) {
      return token
    }
  }
  return ''
}
