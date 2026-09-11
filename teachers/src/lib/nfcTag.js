/** Passport-size AMAN tag: correct Arabic brand + camera-scannable QR (unique child URL). */

export function studentTagCode(student) {
  return String(student?.tagCode || student?.id || '').replace(/[^a-zA-Z0-9_-]/g, '')
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
    img.onerror = () => reject(new Error('Could not load QR image. Check internet and try again.'))
    img.src = src
  })
}

/**
 * Passport-size printable tag (35×45 mm ratio @ 600dpi ≈ 827×1063).
 * - Correct connected Arabic أمان (not broken letters)
 * - Large QR so phone camera opens this child's public page
 * - Same design for every student; QR payload is unique
 */
export async function downloadNfcTag(student, { schoolName = 'NFC Tag school' } = {}) {
  const url = studentPublicUrl(student)
  if (!url) throw new Error('Student tag code missing.')

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=8&ecc=M&data=${encodeURIComponent(url)}`
  const qr = await loadImage(qrSrc)

  // Passport photo proportions 35:45
  const W = 827
  const H = 1063
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Clean white passport card
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#d0d0d0'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)

  // Navy header band
  ctx.fillStyle = '#0b2a4a'
  ctx.fillRect(0, 0, W, 210)

  // Correct Arabic word as one connected string (RTL)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  ctx.font = '700 72px "Segoe UI", Tahoma, "Noto Naskh Arabic", "Arial", sans-serif'
  ctx.fillText('أمان', W / 2, 78)

  ctx.direction = 'ltr'
  ctx.font = '800 34px Manrope, Arial, sans-serif'
  ctx.fillText('AMAN', W / 2, 140)

  ctx.font = '600 20px Manrope, Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.fillText('One Tag · Two Functions', W / 2, 178)

  // Child name
  ctx.fillStyle = '#14241c'
  ctx.font = '700 36px Fraunces, Georgia, "Times New Roman", serif'
  ctx.fillText(truncate(student.name || 'Student', 26), W / 2, 265)

  ctx.fillStyle = '#5d6b63'
  ctx.font = '600 20px Manrope, Arial, sans-serif'
  ctx.fillText(truncate(schoolName, 34), W / 2, 305)

  // Camera-scannable QR (unique URL hidden in the code)
  const qrSize = 420
  const qrX = (W - qrSize) / 2
  const qrY = 340
  roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 20)
  ctx.fillStyle = '#f7f7f7'
  ctx.fill()
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)

  // Scan hint
  ctx.fillStyle = '#0b2a4a'
  ctx.font = '700 24px Manrope, Arial, sans-serif'
  ctx.fillText('Scan with phone camera', W / 2, 820)

  ctx.fillStyle = '#5d6b63'
  ctx.font = '500 18px Manrope, Arial, sans-serif'
  ctx.fillText('Opens this child’s safety page', W / 2, 855)

  // Tiny ID (same visual family; uniqueness is in QR)
  ctx.fillStyle = '#9aa39c'
  ctx.font = '600 16px ui-monospace, Consolas, monospace'
  ctx.fillText(`ID ${studentTagCode(student).slice(0, 10).toUpperCase()}`, W / 2, 900)

  ctx.fillStyle = '#b42318'
  ctx.font = '600 18px Manrope, Arial, sans-serif'
  ctx.fillText('Together for a Safer Tomorrow', W / 2, 960)

  // Passport size label for print shops
  ctx.fillStyle = '#b0b0b0'
  ctx.font = '500 14px Manrope, Arial, sans-serif'
  ctx.fillText('Passport size 35×45 mm', W / 2, 1025)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create tag image.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `AMAN-passport-${safeFileName(student.name)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
  return { ok: true, url }
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
