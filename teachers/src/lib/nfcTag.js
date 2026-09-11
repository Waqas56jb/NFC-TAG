/** Unique public child URL + printable AMAN shirt NFC tag (no QR). */

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
 * Downloads the small white Arabic أمان shirt tag PNG.
 * Visual design is identical for every student; unique NFC URL is returned
 * so staff can write it onto the physical NFC chip (hidden inside the tag).
 */
export async function downloadNfcTag(student) {
  const url = studentPublicUrl(student)
  if (!url) throw new Error('Student tag code missing.')

  // Physical tag proportions: narrow vertical fabric strip
  const W = 280
  const H = 720
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Soft studio backdrop (print crop marks area)
  ctx.fillStyle = '#ece8e1'
  ctx.fillRect(0, 0, W, H)

  // White fabric tag
  const tagX = 48
  const tagY = 40
  const tagW = W - 96
  const tagH = H - 80
  roundRect(ctx, tagX, tagY, tagW, tagH, 22)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#d8d2c8'
  ctx.lineWidth = 2
  ctx.stroke()

  // Subtle weave / fabric feel
  ctx.save()
  ctx.globalAlpha = 0.035
  for (let y = tagY + 8; y < tagY + tagH - 8; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#000' : '#666'
    ctx.fillRect(tagX + 6, y, tagW - 12, 1)
  }
  ctx.restore()

  // Vertical أمان (letter stack, top → bottom) — matches shirt tag mockup
  const letters = ['أ', 'م', 'ا', 'ن']
  const startY = tagY + 110
  const step = 120
  ctx.fillStyle = '#111111'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 92px "Segoe UI", Tahoma, "Noto Naskh Arabic", "Arial", sans-serif'

  letters.forEach((letter, i) => {
    ctx.fillText(letter, W / 2, startY + i * step)
  })

  // Tiny hidden programming aid on the reverse-print margin (not on the visible face)
  // Kept nearly invisible so the tag face stays clean for the shirt.
  ctx.fillStyle = 'rgba(0,0,0,0.04)'
  ctx.font = '500 9px ui-monospace, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(studentTagCode(student).slice(0, 10).toUpperCase(), W / 2, tagY + tagH - 18)

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
