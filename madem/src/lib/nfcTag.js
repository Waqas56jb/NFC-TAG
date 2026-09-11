/** Compact AMAN tag with small QR = unique child profile URL (camera opens browser). */

export function studentTagCode(student) {
  return String(student?.tagCode || student?.id || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
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

function truncate(text, max) {
  const s = String(text || '')
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
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
 * Compact printable tag: أمان + small QR.
 * Each student's QR encodes their unique /c/{code} profile URL.
 * Phone camera → browser opens that child's public profile.
 */
export async function downloadNfcTag(student, { schoolName = 'NFC Tag school' } = {}) {
  const code = studentTagCode(student)
  const url = studentPublicUrl(student)
  if (!code || !url) throw new Error('Student tag code missing.')

  // Small QR (still reliable for phone cameras)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=6&ecc=M&data=${encodeURIComponent(url)}`
  const qr = await loadImage(qrSrc)

  const W = 640
  const H = 860
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)

  // Header
  ctx.fillStyle = '#0b2a4a'
  ctx.fillRect(0, 0, W, 150)

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  ctx.font = '700 56px "Segoe UI", Tahoma, "Traditional Arabic", Arial, sans-serif'
  ctx.fillText('أمان', W / 2, 58)

  ctx.direction = 'ltr'
  ctx.font = '800 26px Arial, Helvetica, sans-serif'
  ctx.fillText('AMAN', W / 2, 112)

  // Student identity
  ctx.fillStyle = '#111111'
  ctx.font = '700 32px Georgia, "Times New Roman", serif'
  ctx.fillText(truncate(student.name || 'Student', 24), W / 2, 200)

  ctx.fillStyle = '#555555'
  ctx.font = '600 18px Arial, Helvetica, sans-serif'
  ctx.fillText(truncate(schoolName, 32), W / 2, 240)

  // Small QR — unique profile link
  const qrSize = 260
  const qrX = (W - qrSize) / 2
  const qrY = 280
  roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 16)
  ctx.fillStyle = '#f5f5f5'
  ctx.fill()
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)

  ctx.fillStyle = '#0b2a4a'
  ctx.font = '700 20px Arial, Helvetica, sans-serif'
  ctx.fillText('Scan with phone camera', W / 2, 600)

  ctx.fillStyle = '#555555'
  ctx.font = '500 16px Arial, Helvetica, sans-serif'
  ctx.fillText('Opens this child’s safety profile', W / 2, 632)

  ctx.fillStyle = '#888888'
  ctx.font = '600 15px "Courier New", Consolas, monospace'
  ctx.fillText(code.slice(0, 12), W / 2, 680)

  ctx.fillStyle = '#b42318'
  ctx.font = '600 16px Arial, Helvetica, sans-serif'
  ctx.fillText('Together for a Safer Tomorrow', W / 2, 740)

  ctx.fillStyle = '#999999'
  ctx.font = '500 13px Arial, Helvetica, sans-serif'
  ctx.fillText('Unique link inside QR · each student different', W / 2, 800)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create tag image.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `AMAN-tag-${safeFileName(student.name)}.png`
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
