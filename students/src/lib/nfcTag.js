/** Tag download = QR only. Unique /c/{code} profile URL encoded inside. */

export function studentTagCode(student) {
  // Prefer real tag_code from DB; do not strip hyphens from UUIDs into a fake code.
  const raw = String(student?.tagCode || '').trim()
  if (raw && raw !== String(student?.id || '')) {
    return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || raw
  }
  const id = String(student?.id || '').trim()
  if (!id) return ''
  // If only id exists, keep UUID form so /c/{uuid} lookup works
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

function safeFileName(name) {
  return String(name || 'student')
    .trim()
    .replace(/[^\w\u0600-\u06FF-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48) || 'student'
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load QR. Check internet and try again.'))
    img.src = src
  })
}

/**
 * Downloads a QR-only PNG. Nothing else on the image.
 * QR payload = this student's unique public profile URL.
 */
export async function downloadNfcTag(student) {
  const code = studentTagCode(student)
  const url = studentPublicUrl(student)
  if (!code || !url) throw new Error('Student tag code missing.')

  const size = 512
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&ecc=M&data=${encodeURIComponent(url)}`
  const qr = await loadImage(qrSrc)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(qr, 0, 0, size, size)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create tag image.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `AMAN-QR-${safeFileName(student.name)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
  return { ok: true, url, code }
}

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
  return { ok: true, url }
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
