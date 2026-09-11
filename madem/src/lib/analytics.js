export const STATUS_KEYS = ['present', 'absent', 'half-leave', 'full-leave', 'medical-leave']

export function dateKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function lastCompletedQuarter(now = new Date()) {
  const q = Math.floor(now.getMonth() / 3)
  if (q === 0) return { year: now.getFullYear() - 1, quarter: 4 }
  return { year: now.getFullYear(), quarter: q }
}

export function sheetDate(value) {
  return String(value || '').slice(0, 10)
}

export function inRange(value, from, to) {
  const date = sheetDate(value)
  return Boolean(date) && date >= from && date <= to
}

export function rangeBounds(preset, extras = {}, now = new Date()) {
  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: dateKey(from), to: dateKey(now) }
  }
  if (preset === 'lastMonth') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from: dateKey(from), to: dateKey(to) }
  }
  if (preset === '6months') {
    const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    return { from: dateKey(from), to: dateKey(now) }
  }
  if (preset === 'quarter') {
    const fallback = lastCompletedQuarter(now)
    const year = Number(extras.year || fallback.year)
    const quarter = Number(extras.quarter || fallback.quarter)
    const startMonth = (quarter - 1) * 3
    const from = new Date(year, startMonth, 1)
    const to = new Date(year, startMonth + 3, 0)
    return { from: dateKey(from), to: dateKey(to) }
  }
  const year = Number(extras.year || now.getFullYear())
  const to = year === now.getFullYear() ? dateKey(now) : `${year}-12-31`
  return { from: `${year}-01-01`, to }
}

export function availableYears(sheets = [], now = new Date()) {
  const years = new Set([now.getFullYear(), now.getFullYear() - 1])
  sheets.forEach((sheet) => {
    const year = Number(String(sheet.date || '').slice(0, 4))
    if (year) years.add(year)
  })
  return [...years].sort((a, b) => b - a)
}

export function isLeave(status) {
  return status === 'half-leave' || status === 'full-leave' || status === 'medical-leave'
}

function emptyCounts() {
  return { present: 0, absent: 0, 'half-leave': 0, 'full-leave': 0, 'medical-leave': 0 }
}

function addCount(target, status) {
  if (target[status] == null) target[status] = 0
  target[status] += 1
}

function bucketKey(date, preset) {
  if (preset === 'lastMonth' || preset === 'thisMonth') return date
  return String(date).slice(0, 7)
}

function prettyBucket(key, locale) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(locale === 'ar' ? 'ar' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }
  const [y, m] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString(locale === 'ar' ? 'ar' : 'en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

export function buildAnalytics({
  sheets = [],
  students = [],
  grades = [],
  teachers = [],
  from,
  to,
  gradeId = '',
  classKey = '',
  teacherId = '',
  preset = 'lastMonth',
  locale = 'en',
}) {
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
  const cards = (grades || []).flatMap((grade) =>
    (grade.sections || []).map((section) => ({
      gradeId: grade.id,
      sectionId: section.id,
      gradeName: grade.name,
      sectionName: section.name,
      key: `${grade.id}:${section.id}`,
    })),
  )
  const cardMap = Object.fromEntries(cards.map((c) => [c.key, c]))

  const filtered = sheets.filter((sheet) => {
    if (!inRange(sheet.date, from, to)) return false
    if (gradeId && sheet.gradeId !== gradeId) return false
    if (classKey && `${sheet.gradeId}:${sheet.sectionId}` !== classKey) return false
    if (teacherId && sheet.teacherId !== teacherId) return false
    return true
  })

  const counts = emptyCounts()
  const byDate = {}
  const byGrade = {}
  const byClass = {}
  const byTeacher = {}
  const byStudent = {}

  filtered.forEach((sheet) => {
    const key = `${sheet.gradeId}:${sheet.sectionId}`
    const card = cardMap[key]
    const day = bucketKey(sheetDate(sheet.date), preset)
    if (!byDate[day]) byDate[day] = emptyCounts()
    if (card) {
      if (!byGrade[card.gradeId]) byGrade[card.gradeId] = { ...emptyCounts(), name: card.gradeName }
      if (!byClass[key]) byClass[key] = { ...emptyCounts(), name: `${card.gradeName} ${card.sectionName}`, gradeName: card.gradeName, sectionName: card.sectionName }
    }
    const tKey = sheet.teacherId || sheet.teacherName || 'unknown'
    if (!byTeacher[tKey]) byTeacher[tKey] = { ...emptyCounts(), name: sheet.teacherName || '—' }

    Object.entries(sheet.marks || {}).forEach(([studentId, status]) => {
      const mark = STATUS_KEYS.includes(status) ? status : 'present'
      addCount(counts, mark)
      addCount(byDate[day], mark)
      if (card) {
        addCount(byGrade[card.gradeId], mark)
        addCount(byClass[key], mark)
      }
      addCount(byTeacher[tKey], mark)
      if (!byStudent[studentId]) {
        const student = studentMap[studentId]
        byStudent[studentId] = {
          ...emptyCounts(),
          id: studentId,
          name: student?.name || studentId,
          photo: student?.photo || '',
          className: card ? `${card.gradeName} ${card.sectionName}` : '',
          gradeName: card?.gradeName || '',
        }
      }
      addCount(byStudent[studentId], mark)
    })
  })

  const leaves = counts['half-leave'] + counts['full-leave'] + counts['medical-leave']
  const total = counts.present + counts.absent + leaves
  const rate = total ? Math.round((counts.present / total) * 100) : 0

  const unique = { present: 0, absent: 0, leave: 0 }
  Object.values(byStudent).forEach((row) => {
    if (row.present) unique.present += 1
    if (row.absent) unique.absent += 1
    if (row['half-leave'] + row['full-leave'] + row['medical-leave']) unique.leave += 1
  })

  const trend = Object.keys(byDate)
    .sort()
    .map((key) => ({
      key,
      label: prettyBucket(key, locale),
      ...byDate[key],
      leaves: byDate[key]['half-leave'] + byDate[key]['full-leave'] + byDate[key]['medical-leave'],
    }))

  function withRate(row) {
    const rowLeaves = row['half-leave'] + row['full-leave'] + row['medical-leave']
    const rowTotal = row.present + row.absent + rowLeaves
    return { ...row, leaves: rowLeaves, total: rowTotal, rate: rowTotal ? Math.round((row.present / rowTotal) * 100) : 0 }
  }

  const studentsRanked = Object.values(byStudent)
    .map(withRate)
    .sort((a, b) => b.absent - a.absent || b.leaves - a.leaves)

  return {
    from,
    to,
    days: filtered.length,
    counts,
    leaves,
    total,
    rate,
    unique,
    trend,
    byGrade: Object.values(byGrade).map(withRate).sort((a, b) => a.name.localeCompare(b.name)),
    byClass: Object.values(byClass).map(withRate).sort((a, b) => a.name.localeCompare(b.name)),
    byTeacher: Object.values(byTeacher).map(withRate).sort((a, b) => b.total - a.total),
    topAbsent: studentsRanked.filter((s) => s.absent).slice(0, 8),
    topLeave: [...studentsRanked].sort((a, b) => b.leaves - a.leaves).filter((s) => s.leaves).slice(0, 8),
    teachers,
  }
}

export function prettyRange(from, to, locale = 'en') {
  const loc = locale === 'ar' ? 'ar' : 'en-GB'
  const fmt = (iso) => {
    const [y, m, d] = String(iso).split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return `${fmt(from)} – ${fmt(to)}`
}
