import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { assignedClasses, isAssigned, todayKey } from '../lib/school'
import { loadTeacherSession, logoutTeacher, saveTeacherSession } from '../lib/auth'
import { emptySchool } from '../lib/nfctagApi'
import { api, desk, hub } from '../lib/supabase'

const TeacherContext = createContext(null)

export function TeacherProvider({ children }) {
  const { t, tx } = useI18n()
  const [school, setSchool] = useState(emptySchool)
  const [session, setSession] = useState(() => loadTeacherSession())
  const [toast, setToast] = useState(null)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState('')
  const [groups, setGroups] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [teacherDays, setTeacherDays] = useState([])
  const [teacherLeaves, setTeacherLeaves] = useState([])
  const [inboxNotes, setInboxNotes] = useState([])

  async function refreshDesk(teacherId = session?.id) {
    const [days, leaves, notes] = await Promise.all([
      desk.listTeacherDays(),
      desk.listLeaves(),
      teacherId ? desk.listNotifications(teacherId) : Promise.resolve({ ok: true, notifications: [] }),
    ])
    if (days.ok) setTeacherDays(days.days)
    if (leaves.ok) setTeacherLeaves(leaves.leaves)
    if (notes.ok) setInboxNotes(notes.notifications)
  }

  async function refresh() {
    const data = await api.fetchSchool()
    setSchool(data)
    const [g, a] = await Promise.all([hub.listGroups(), hub.listAnnouncements()])
    if (g.ok) setGroups(g.groups)
    if (a.ok) setAnnouncements(a.announcements)
    await refreshDesk()
    setBootError('')
    return data
  }

  async function boot() {
    setReady(false)
    setBootError('')
    try {
      await refresh()
    } catch (err) {
      setBootError(err.message || 'Could not load school data.')
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    boot()
  }, [])

  const teacher = useMemo(() => {
    if (!session) return null
    const live = (school.teachers || []).find((t) => t.id === session.id || t.email === session.email)
    if (live && live.status === 'blocked') return null
    return live ? { ...live, role: 'teacher' } : null
  }, [session, school])

  const classes = useMemo(
    () => (teacher ? assignedClasses(school, teacher) : []),
    [school, teacher],
  )

  function notify(message) {
    setToast({ message, id: `${Date.now()}` })
    window.setTimeout(() => setToast(null), 2600)
  }

  async function login(email, password) {
    const result = await api.loginTeacher(email, password)
    if (!result.ok) return result
    setSession(result.teacher)
    saveTeacherSession(result.teacher)
    const data = await api.fetchSchool()
    setSchool(data)
    const [g, a] = await Promise.all([hub.listGroups(), hub.listAnnouncements()])
    if (g.ok) setGroups(g.groups)
    if (a.ok) setAnnouncements(a.announcements)
    await refreshDesk(result.teacher.id)
    return { ok: true }
  }

  function logout() {
    logoutTeacher()
    setSession(null)
  }

  function canOpen(gradeId, sectionId) {
    return teacher ? isAssigned(school, teacher, gradeId, sectionId) : false
  }

  async function saveAttendance({ date, gradeId, sectionId, marks }) {
    if (!teacher) return { ok: false, error: 'Not signed in.' }
    if (!canOpen(gradeId, sectionId)) return { ok: false, error: 'This class is not assigned to you.' }
    const result = await api.upsertAttendance({ date, gradeId, sectionId, marks, teacher })
    if (!result.ok) {
      notify(tx(result.error))
      return result
    }
    await refresh()
    notify(result.created ? t('toastCreated') : date === todayKey() ? t('toastToday') : t('toastUpdated'))
    return result
  }

  return (
    <TeacherContext.Provider value={{
      school, teacher, classes, toast, ready, bootError, boot, hasSession: Boolean(session), login, logout, canOpen, saveAttendance,
      groups, announcements, inboxNotes, teacherDays, teacherLeaves, loadMessages: hub.listMessages,
      async checkIn() {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await desk.checkIn(teacher)
        if (!result.ok) { notify(tx(result.error)); return result }
        await refreshDesk(teacher.id)
        notify(t('toastCheckedIn'))
        return result
      },
      async checkOut() {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await desk.checkOut(teacher)
        if (!result.ok) { notify(tx(result.error)); return result }
        await refreshDesk(teacher.id)
        notify(t('toastCheckedOut'))
        return result
      },
      async requestLeave(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await desk.requestLeave(payload, teacher)
        if (!result.ok) { notify(tx(result.error)); return result }
        await refreshDesk(teacher.id)
        notify(t('toastLeaveRequested'))
        return result
      },
      async createGroup(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await hub.createGroup(payload, teacher)
        if (!result.ok) { notify(tx(result.error)); return result }
        const g = await hub.listGroups(); if (g.ok) setGroups(g.groups)
        notify(t('toastGroupCreated'))
        return result
      },
      async updateGroupPhoto(id, photo) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await hub.updateGroupPhoto(id, photo)
        if (!result.ok) { notify(tx(result.error)); return result }
        const g = await hub.listGroups(); if (g.ok) setGroups(g.groups)
        notify(t('toastGroupPhoto'))
        return result
      },
      async postGroupMessage(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await hub.postMessage(payload, teacher)
        if (!result.ok) notify(tx(result.error))
        return result
      },
      async deleteGroupMessage(id) {
        const result = await hub.deleteMessage(id)
        if (!result.ok) notify(tx(result.error))
        return result
      },
      async postAnnouncement(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        const result = await hub.postAnnouncement(payload, teacher)
        if (!result.ok) { notify(tx(result.error)); return result }
        const a = await hub.listAnnouncements(); if (a.ok) setAnnouncements(a.announcements)
        notify(t('toastAnnouncePosted'))
        return result
      },
      async deleteAnnouncement(id) {
        const result = await hub.deleteAnnouncement(id)
        if (result.ok) {
          const a = await hub.listAnnouncements(); if (a.ok) setAnnouncements(a.announcements)
        }
        return result
      },
    }}>
      {children}
    </TeacherContext.Provider>
  )
}

export function useTeacher() {
  const ctx = useContext(TeacherContext)
  if (!ctx) throw new Error('useTeacher must be used inside TeacherProvider')
  return ctx
}
