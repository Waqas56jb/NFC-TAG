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
  const [actionBusy, setActionBusy] = useState(0)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState('')
  const [groups, setGroups] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [teacherDays, setTeacherDays] = useState([])
  const [teacherLeaves, setTeacherLeaves] = useState([])
  const [studentLeaves, setStudentLeaves] = useState([])
  const [inboxNotes, setInboxNotes] = useState([])

  async function refreshDesk(teacherId = session?.id) {
    const [days, leaves, notes, passes] = await Promise.all([
      desk.listTeacherDays(),
      desk.listLeaves(),
      teacherId ? desk.listNotifications(teacherId) : Promise.resolve({ ok: true, notifications: [] }),
      hub.listStudentLeaves(),
    ])
    if (days.ok) setTeacherDays(days.days)
    if (leaves.ok) setTeacherLeaves(leaves.leaves)
    if (notes.ok) setInboxNotes(notes.notifications)
    if (passes.ok) setStudentLeaves(passes.leaves)
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

  async function login(email, password) {
    return withBusy(async () => {
      const result = await api.loginTeacher(email, password)
      if (!result.ok) return result
      setSession(result.teacher)
      saveTeacherSession(result.teacher)
      try {
        await refresh()
        notify(t('toastSignedIn') || 'Signed in.')
        return { ok: true }
      } catch (err) {
        setBootError(err.message || 'Could not load school data.')
        return { ok: false, error: err.message || 'Signed in, but school data failed to load. Tap Try again.' }
      }
    })
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
    return withBusy(async () => {
      const result = await api.upsertAttendance({ date, gradeId, sectionId, marks, teacher })
      if (!result.ok) {
        notify(tx(result.error), 'bad')
        return result
      }
      await refresh()
      notify(result.created ? t('toastCreated') : date === todayKey() ? t('toastToday') : t('toastUpdated'))
      return result
    })
  }

  return (
    <TeacherContext.Provider value={{
      school, teacher, classes, toast, actionBusy, ready, bootError, boot, notify, hasSession: Boolean(session), login, logout, canOpen, saveAttendance,
      groups, announcements, inboxNotes, teacherDays, teacherLeaves, studentLeaves, loadMessages: hub.listMessages,
      async checkIn() {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await desk.checkIn(teacher)
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          await refreshDesk(teacher.id)
          notify(t('toastCheckedIn'))
          return result
        })
      },
      async checkOut() {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await desk.checkOut(teacher)
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          await refreshDesk(teacher.id)
          notify(t('toastCheckedOut'))
          return result
        })
      },
      async requestLeave(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await desk.requestLeave(payload, teacher)
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          await refreshDesk(teacher.id)
          notify(t('toastLeaveRequested'))
          return result
        })
      },
      async reviewStudentLeave(id, status) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.reviewStudentLeave(id, status, { ...teacher, role: 'teacher' })
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          await refreshDesk(teacher.id)
          notify(
            status === 'approved'
              ? t('toastStudentLeaveApproved')
              : status === 'returned'
                ? t('toastStudentLeaveReturned')
                : t('toastStudentLeaveRejected'),
          )
          return result
        })
      },
      async markStudentReturned(id) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.markStudentReturned(id, { ...teacher, role: 'teacher' })
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          await refreshDesk(teacher.id)
          notify(t('toastStudentLeaveReturned'))
          return result
        })
      },
      async scanStudentLeave(raw, leaveType) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.recordNfcLeaveScan(raw, { leaveType }, { ...teacher, role: 'teacher' })
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          await refreshDesk(teacher.id)
          notify(
            result.action === 'returned'
              ? t('nfcLeaveReturnedToast', { name: result.student?.name || '' })
              : t('nfcLeaveOutToast', { name: result.student?.name || '' }),
          )
          return result
        })
      },
      async createGroup(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.createGroup(payload, teacher)
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          const g = await hub.listGroups(); if (g.ok) setGroups(g.groups)
          notify(t('toastGroupCreated'))
          return result
        })
      },
      async updateGroupPhoto(id, photo) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.updateGroupPhoto(id, photo)
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          const g = await hub.listGroups(); if (g.ok) setGroups(g.groups)
          notify(t('toastGroupPhoto'))
          return result
        })
      },
      async postGroupMessage(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.postMessage(payload, teacher)
          if (!result.ok) notify(tx(result.error), 'bad')
          return result
        })
      },
      loadDmMessages: hub.listDmMessages,
      openDmThread: hub.openDmThread,
      async postDmMessage(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.postDmMessage(payload, { ...teacher, role: 'teacher' })
          if (!result.ok) notify(tx(result.error), 'bad')
          return result
        })
      },
      listHomework: hub.listHomework,
      async createHomework(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.createHomework(
            { ...payload, courseName: teacher.subject || payload.courseName || '' },
            { ...teacher, role: 'teacher', subject: teacher.subject || '' },
          )
          if (!result.ok) notify(tx(result.error), 'bad')
          else notify(t('toastHomeworkPosted'))
          return result
        })
      },
      async deleteHomework(id) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.deleteHomework(id, { ...teacher, role: 'teacher' })
          if (!result.ok) notify(tx(result.error), 'bad')
          else notify(t('toastHomeworkDeleted'))
          return result
        })
      },
      async deleteGroupMessage(id) {
        return withBusy(async () => {
          const result = await hub.deleteMessage(id)
          if (!result.ok) notify(tx(result.error), 'bad')
          else notify(t('toastMessageDeleted') || 'Message deleted.')
          return result
        })
      },
      async postAnnouncement(payload) {
        if (!teacher) return { ok: false, error: t('errSignIn') }
        return withBusy(async () => {
          const result = await hub.postAnnouncement(payload, teacher)
          if (!result.ok) { notify(tx(result.error), 'bad'); return result }
          const a = await hub.listAnnouncements(); if (a.ok) setAnnouncements(a.announcements)
          notify(t('toastAnnouncePosted'))
          return result
        })
      },
      async deleteAnnouncement(id) {
        return withBusy(async () => {
          const result = await hub.deleteAnnouncement(id)
          if (result.ok) {
            const a = await hub.listAnnouncements(); if (a.ok) setAnnouncements(a.announcements)
            notify(t('toastAnnounceDeleted') || 'Announcement removed.')
          } else {
            notify(tx(result.error), 'bad')
          }
          return result
        })
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
