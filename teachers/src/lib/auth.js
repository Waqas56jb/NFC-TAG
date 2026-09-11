const SESSION_KEY = 'nfc-teacher-session'

export function loadTeacherSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveTeacherSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function logoutTeacher() {
  localStorage.removeItem(SESSION_KEY)
}
