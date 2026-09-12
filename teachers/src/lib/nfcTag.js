/** Unique public NFC profile URL helpers (no QR). */

export function studentTagCode(student) {
  const raw = String(student?.tagCode || '').trim()
  if (raw && raw !== String(student?.id || '')) {
    return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || raw
  }
  const id = String(student?.id || '').trim()
  if (!id) return ''
  if (/^[0-9a-f-]{36}$/i.test(id)) return id.toLowerCase()
  return id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
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
  const text = String(raw || '').toUpperCase().replace(/[^A-Z0-9\s]/g, ' ')
  const tokens = text.split(/\s+/).filter(Boolean)
  for (const token of tokens) {
    if (/^[A-Z0-9]{8,16}$/.test(token) && !/^(AMAN|OPEN|SCAN|CAMERA|CODE|THIS)$/.test(token)) {
      return token
    }
  }
  const joined = text.replace(/\s+/g, '')
  const m = joined.match(/[A-Z0-9]{8,16}/)
  return m ? m[0] : ''
}
