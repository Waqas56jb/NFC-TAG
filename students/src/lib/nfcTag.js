/** Small AMAN shirt tag — Arabic أمان only (no QR). Unique URL is for NFC chip write. */

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

/**
 * Downloads the small white shirt tag with straight (horizontal) Arabic أمان.
 * Same look for every student. Phone camera cannot read this — write `url`
 * onto the NFC chip inside the physical tag (tap phone to open child page).
 */
export async function downloadNfcTag(student) {
  const url = studentPublicUrl(student)
  if (!url) throw new Error('Student tag code missing.')

  // Compact fabric label — horizontal so أمان reads seedha (normal Arabic)
  const W = 900
  const H = 420
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Soft print backdrop
  ctx.fillStyle = '#ece8e1'
  ctx.fillRect(0, 0, W, H)

  // White tag body
  const pad = 36
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 28)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#cfc8bc'
  ctx.lineWidth = 3
  ctx.stroke()

  // Straight connected Arabic — no rotate, no letter stack
  ctx.save()
  ctx.fillStyle = '#111111'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  // Prefer fonts that render Arabic correctly on Windows/macOS
  ctx.font = '700 168px "Segoe UI", Tahoma, "Traditional Arabic", "Noto Naskh Arabic", Arial, sans-serif'
  ctx.fillText('أمان', W / 2, H / 2 - 8)
  ctx.restore()

  // Tiny English mark under the word (optional brand, still horizontal)
  ctx.direction = 'ltr'
  ctx.fillStyle = '#8a8a8a'
  ctx.font = '600 22px Manrope, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('AMAN', W / 2, H / 2 + 110)

  // Invisible-for-print programming code (very faint) — NFC chip gets full URL via copy
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  ctx.font = '500 14px ui-monospace, Consolas, monospace'
  ctx.fillText(studentTagCode(student).slice(0, 12).toUpperCase(), W / 2, H - 52)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create tag image.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `AMAN-tag-${safeFileName(student.name)}.png`
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
