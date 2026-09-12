/** User-facing labels — never show raw "madam". */

export function cleanPersonName(name, role = '') {
  let n = String(name || '')
    .replace(/\bmadam\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const r = String(role || '').toLowerCase()
  if (!n && (r === 'madam' || r === 'principal')) return 'Principal'
  if (/^principal$/i.test(n)) return 'Principal'
  if (!n && r === 'teacher') return 'Teacher'
  return n
}

export function roleLabel(role, t) {
  const r = String(role || '').toLowerCase()
  if (r === 'madam' || r === 'principal') return t?.('rolePrincipal') || 'Principal'
  if (r === 'teacher') return t?.('roleTeacher') || 'Teacher'
  if (r === 'student') return t?.('roleStudent') || t?.('studentRole') || 'Student'
  if (r === 'sub') return t?.('roleHelper') || 'Helper'
  if (!r) return ''
  return r
}
