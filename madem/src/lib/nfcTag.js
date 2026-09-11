/** Small AMAN shirt tag — white bg, clear Arabic أمان + OCR-readable unique code (no QR). */

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

/**
 * High-contrast white tag for print + camera OCR (no QR).
 * Camera apps detect the unique CODE under أمان via the in-app /scan page.
 */
export async function downloadNfcTag(student) {
  const code = studentTagCode(student)
  const url = studentPublicUrl(student)
  if (!code || !url) throw new Error('Student tag code missing.')

  const W = 1000
  const H = 560
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Pure white — max contrast for camera
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Thin black frame so edges are clear when photographed
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, W - 8, H - 8)

  // Straight connected Arabic — seedha, high contrast
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  ctx.font = '700 200px "Segoe UI", Tahoma, "Traditional Arabic", "Arial", sans-serif'
  ctx.fillText('أمان', W / 2, 175)

  ctx.direction = 'ltr'
  ctx.font = '800 36px Arial, Helvetica, sans-serif'
  ctx.fillStyle = '#000000'
  ctx.fillText('AMAN', W / 2, 290)

  // Unique code — large, OCR-friendly (camera detects THIS, not a QR)
  ctx.font = '800 64px "Courier New", Consolas, monospace'
  ctx.fillStyle = '#000000'
  ctx.fillText(code, W / 2, 400)

  ctx.font = '600 22px Arial, Helvetica, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText('Open AMAN Scan · point camera at this code', W / 2, 480)

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

/** Extract a tag code from OCR / TextDetector output. */
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
