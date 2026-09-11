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
  const [dmThreads, setDmThreads] = useState([])
  const [leaves, setLeaves] = useState([])
  const [toast, setToast] = useState(null)
  const [actionBusy, setActionBusy] = useState(0)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState('')

  function notify(message, tone = 'ok') {
    setToast({ message, tone, id: `${Date.now()}` })
    window.setTimeout(() => setToast(null), 3200)
  }

  async function withBusy(fn) {
    setActionBusy((n) => n + 1)
    try {
      return await fn()
    } finally {
      setActionBusy((n) => Math.max(0, n - 1))
    }
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
      if (nextStudent?.id) {
        const dms = await hub.listDmThreadsForStudent(nextStudent.id)
        if (dms.ok) setDmThreads(dms.threads)
        const lv = await hub.listStudentLeaves({ studentId: nextStudent.id })
        if (lv.ok) setLeaves(lv.leaves)
      } else {
        setDmThreads([])
        setLeaves([])
      }
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
    return withBusy(async () => {
      const result = await hub.loginStudent(email, password)
      if (!result.ok) return result
      setStudent(result.student)
      saveSession(result.student)
      await refresh(result.student)
      notify(t('toastSignedIn') || 'Signed in.')
      return { ok: true }
    })
  }

  function logout() {
    clearSession()
    setStudent(null)
    setAttendance([])
    setDmThreads([])
    setLeaves([])
  }

  return (
    <StudentContext.Provider
      value={{
        student,
        grades,
        groups,
        attendance,
        announcements,
        dmThreads,
        leaves,
        allowedCards,
        toast,
        actionBusy,
        ready,
        bootError,
        boot,
        notify,
        login,
        logout,
        loadMessages: hub.listMessages,
        loadDmMessages: hub.listDmMessages,
        async refreshLeaves() {
          if (!student?.id) return { ok: true, leaves: [] }
          const lv = await hub.listStudentLeaves({ studentId: student.id })
          if (lv.ok) setLeaves(lv.leaves)
          return lv
        },
        async requestLeave(payload) {
          if (!student) return { ok: false, error: t('errSignIn') }
          return withBusy(async () => {
            const result = await hub.requestStudentLeave(payload, student)
            if (!result.ok) notify(tx(result.error), 'bad')
            else {
              notify(t('toastLeaveSent'))
              const lv = await hub.listStudentLeaves({ studentId: student.id })
              if (lv.ok) setLeaves(lv.leaves)
            }
            return result
          })
        },
        async postGroupMessage(payload) {
          if (!student) return { ok: false, error: t('errSignIn') }
          return withBusy(async () => {
            const result = await hub.postMessage(payload, student)
            if (!result.ok) notify(tx(result.error), 'bad')
            return result
          })
        },
        async postDmMessage(payload) {
          if (!student) return { ok: false, error: t('errSignIn') }
          return withBusy(async () => {
            const result = await hub.postDmMessage(payload, student)
            if (!result.ok) notify(tx(result.error), 'bad')
            else {
              const dms = await hub.listDmThreadsForStudent(student.id)
              if (dms.ok) setDmThreads(dms.threads)
            }
            return result
          })
        },
        async refreshDmThreads() {
          if (!student?.id) return { ok: true, threads: [] }
          const dms = await hub.listDmThreadsForStudent(student.id)
          if (dms.ok) setDmThreads(dms.threads)
          return dms
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
