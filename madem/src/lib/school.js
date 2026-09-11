export const ATTENDANCE_STATUSES = [
  { id: 'present', label: 'Present' },
  { id: 'absent', label: 'Absent' },
  { id: 'half-leave', label: 'Half leave' },
  { id: 'full-leave', label: 'Full leave' },
  { id: 'medical-leave', label: 'Medical leave' },
]

export function listClassCards(grades = []) {
  return grades.flatMap((grade) =>
    (grade.sections || []).map((section) => ({
      gradeId: grade.id,
      sectionId: section.id,
      gradeName: grade.name,
      sectionName: section.name,
      label: `${grade.name} Section ${section.name}`,
    })),
  )
}

export function classLabel(grades, gradeId, sectionId) {
  return listClassCards(grades).find((c) => c.gradeId === gradeId && c.sectionId === sectionId)?.label || 'Class'
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item'
}

export function classPath(gradeName, sectionName) {
  return `/classes/${slugify(gradeName)}/${slugify(sectionName)}`
}

export function resolveClassRoute(grades, gradeKey, sectionKey) {
  const cards = listClassCards(grades)
  const card =
    cards.find((c) => slugify(c.gradeName) === gradeKey && slugify(c.sectionName) === sectionKey) ||
    cards.find((c) => c.gradeId === gradeKey && c.sectionId === sectionKey)
  if (!card) return null
  return { ...card, path: classPath(card.gradeName, card.sectionName) }
}

export function prettyDate(iso, locale = 'en') {
  if (!iso) return ''
  const [year, month, day] = String(iso).split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString(locale === 'ar' ? 'ar' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function prettyTime(iso, locale = 'en') {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(locale === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
