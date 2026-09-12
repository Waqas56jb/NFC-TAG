const LIMITS = { image: 5 * 1024 * 1024, video: 10 * 1024 * 1024, file: 8 * 1024 * 1024 }

export function kindFromFile(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

export function readShareFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(null); return }
    const kind = kindFromFile(file)
    if (file.size > LIMITS[kind]) {
      reject(new Error(`This ${kind} must be under ${Math.round(LIMITS[kind] / 1024 / 1024)}MB.`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve({ fileName: file.name, fileType: file.type || kind, fileData: String(reader.result || ''), kind })
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

export function seenKey(role, id) { return `nfc-announce-seen-${role}-${id}` }

export function unreadCount(announcements, role, id) {
  try {
    const seen = localStorage.getItem(seenKey(role, id)) || ''
    return announcements.filter((item) => String(item.createdAt) > seen).length
  } catch {
    return announcements.length
  }
}

export function markAnnouncementsSeen(role, id) {
  try { localStorage.setItem(seenKey(role, id), new Date().toISOString()) } catch { /* ignore */ }
}

export function homeworkSeenKey(id) {
  return `nfc-homework-seen-student-${id}`
}

export function unreadHomeworkCount(homework, id) {
  try {
    const seen = localStorage.getItem(homeworkSeenKey(id)) || ''
    return (homework || []).filter((item) => String(item.createdAt || '') > seen).length
  } catch {
    return (homework || []).length
  }
}

export function markHomeworkSeen(id) {
  try {
    localStorage.setItem(homeworkSeenKey(id), new Date().toISOString())
  } catch {
    /* ignore */
  }
}
