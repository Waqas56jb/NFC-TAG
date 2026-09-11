/** Unique public child URL + printable AMAN NFC/QR tag card */

export function studentTagCode(student) {
  return String(student?.tagCode || student?.id || '').replace(/[^a-zA-Z0-9_-]/g, '')
}

export function publicTagBase() {
  const fromEnv = (import.meta.env.VITE_PUBLIC_TAG_BASE || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    // Madam/Teacher panels point tags at the students (public) app when possible.
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load QR image.'))
    img.src = src
  })
}

function safeFileName(name) {
  return String(name || 'student')
    .trim()
    .replace(/[^\w\u0600-\u06FF-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48) || 'student'
}

/**
 * Downloads a printable AMAN NFC tag PNG.
 * Same visual design for every student; unique QR/URL is embedded (hidden identity).
 */
export async function downloadNfcTag(student, { schoolName = 'NFC Tag school' } = {}) {
  const url = studentPublicUrl(student)
  if (!url) throw new Error('Student tag code missing.')

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(url)}`
  const qr = await loadImage(qrSrc)

  const W = 720
  const H = 1040
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#f4efe6'
  ctx.fillRect(0, 0, W, H)

  // Outer card
  roundRect(ctx, 36, 36, W - 72, H - 72, 36)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#d9cbb0'
  ctx.lineWidth = 3
  ctx.stroke()

  // Header band
  const grad = ctx.createLinearGradient(0, 60, 0, 260)
  grad.addColorStop(0, '#0b2a4a')
  grad.addColorStop(1, '#163a5f')
  roundRect(ctx, 60, 60, W - 120, 210, 28)
  ctx.fillStyle = grad
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 42px Georgia, "Times New Roman", serif'
  ctx.textAlign = 'center'
  ctx.fillText('أمان', W / 2, 130)
  ctx.font = '800 28px Manrope, Arial, sans-serif'
  ctx.fillText('AMAN', W / 2, 175)
  ctx.font = '600 18px Manrope, Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('One Tag · Two Functions', W / 2, 215)

  // Child name
  ctx.fillStyle = '#14241c'
  ctx.font = '700 34px Fraunces, Georgia, serif'
  ctx.fillText(truncate(student.name || 'Student', 28), W / 2, 330)

  ctx.fillStyle = '#5d6b63'
  ctx.font = '600 18px Manrope, Arial, sans-serif'
  ctx.fillText(truncate(schoolName, 36), W / 2, 365)

  // QR
  const qrSize = 340
  const qrX = (W - qrSize) / 2
  const qrY = 400
  roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24)
  ctx.fillStyle = '#faf7f1'
  ctx.fill()
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)

  // Footer instructions
  ctx.fillStyle = '#0b2a4a'
  ctx.font = '700 20px Manrope, Arial, sans-serif'
  ctx.fillText('Tap with your phone · Scan QR', W / 2, 800)

  ctx.fillStyle = '#5d6b63'
  ctx.font = '500 16px Manrope, Arial, sans-serif'
  ctx.fillText('Opens this child’s safety page', W / 2, 835)

  // Tiny unique code (not the full URL — design looks same)
  ctx.font = '600 14px ui-monospace, Consolas, monospace'
  ctx.fillStyle = '#9aa39c'
  ctx.fillText(`ID ${studentTagCode(student).slice(0, 8).toUpperCase()}`, W / 2, 880)

  ctx.fillStyle = '#b42318'
  ctx.font = '600 16px Manrope, Arial, sans-serif'
  ctx.fillText('Together for a Safer Tomorrow', W / 2, 940)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create tag image.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `AMAN-NFC-${safeFileName(student.name)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
  return { ok: true, url }
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
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
