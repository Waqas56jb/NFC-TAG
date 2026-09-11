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
      label: `${grade.name} · Section ${section.name}`,
    })),
  )
}

export function classLabel(grades, gradeId, sectionId) {
  return listClassCards(grades).find((c) => c.gradeId === gradeId && c.sectionId === sectionId)?.label || ''
}

export function statusKey(id) {
  return `status_${String(id || '').replaceAll('-', '_')}`
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
