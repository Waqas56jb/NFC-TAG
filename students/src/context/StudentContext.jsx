import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { hub } from '../lib/hubClient'
import { listClassCards } from '../lib/school'

const SESSION_KEY = 'nfc-student-session'
const StudentContext = createContext(null)

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(student) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(student))
  } catch {
    /* ignore */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function StudentProvider({ children }) {
  const { t, tx } = useI18n()
  const [student, setStudent] = useState(() => loadSession())
  const [grades, setGrades] = useState([])
  const [groups, setGroups] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [attendance, setAttendance] = useState([])
  const [toast, setToast] = useState(null)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState('')

  function notify(message) {
    setToast({ message, id: `${Date.now()}` })
    window.setTimeout(() => setToast(null), 2600)
  }

  async function refresh(nextStudent = student) {
    try {
      const school = await hub.fetchSchool()
      setGrades(school.grades || [])
      const jobs = [hub.listGroups(), hub.listAnnouncements()]
      if (nextStudent?.id) {
        jobs.push(hub.fetchStudent(nextStudent.id))
        jobs.push(hub.listMyAttendance(nextStudent.gradeId, nextStudent.sectionId, nextStudent.id))
      }
      const [g, a, profile, mine] = await Promise.all(jobs)
      if (g?.ok) setGroups(g.groups)
      if (a?.ok) setAnnouncements(a.announcements)
      if (profile?.ok) {
        setStudent(profile.student)
        saveSession(profile.student)
      }
      if (mine?.ok) setAttendance(mine.records)
      else if (!nextStudent?.id) setAttendance([])
      setBootError('')
      return school
    } catch (err) {
      setBootError(err.message || t('errBoot'))
      return { grades: [] }
    }
  }

  async function boot() {
    setReady(false)
    setBootError('')
    try {
      await refresh()
    } catch (err) {
      setBootError(err.message || t('errBoot'))
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    boot()
  }, [])

  const allowedCards = useMemo(() => {
    if (!student) return []
    const cards = listClassCards(grades)
    const mine = cards.filter((c) => c.gradeId === student.gradeId && c.sectionId === student.sectionId)
    return mine.length ? mine : cards.filter((c) => c.gradeId === student.gradeId)
  }, [grades, student])

  async function login(email, password) {
    const result = await hub.loginStudent(email, password)
    if (!result.ok) return result
    setStudent(result.student)
    saveSession(result.student)
    await refresh(result.student)
    return { ok: true }
  }

  function logout() {
    clearSession()
    setStudent(null)
    setAttendance([])
  }

  return (
    <StudentContext.Provider
      value={{
        student,
        grades,
        groups,
        attendance,
        announcements,
        allowedCards,
        toast,
        ready,
        bootError,
        boot,
        login,
        logout,
        loadMessages: hub.listMessages,
        async postGroupMessage(payload) {
          if (!student) return { ok: false, error: t('errSignIn') }
          const result = await hub.postMessage(payload, student)
          if (!result.ok) notify(tx(result.error))
          return result
        },
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider')
  return ctx
}
