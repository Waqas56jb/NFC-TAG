import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { classLabel, todayKey } from '../lib/school'
import { emptySchool } from '../lib/nfctagApi'
import { api, desk, hub } from '../lib/supabase'
import { loadSession, saveSession } from '../lib/storage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { t, tx } = useI18n()
  const [store, setStore] = useState(emptySchool)
  const [session, setSession] = useState(() => loadSession())
  const [toast, setToast] = useState(null)
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState('')
  const [groups, setGroups] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [teacherDays, setTeacherDays] = useState([])
  const [teacherLeaves, setTeacherLeaves] = useState([])

  const user = useMemo(() => {
    if (!session) return null
    if (session.role === 'madam') {
      const madam = store.madams.find((m) => m.id === session.id) || store.madam
      return madam?.id ? { ...madam, role: 'madam' } : null
    }
    const sub = store.subUsers.find((s) => s.id === session.id)
    if (!sub || sub.status === 'blocked') return null
    return { ...sub, role: 'sub' }
  }, [session, store])

  async function refresh(nextSession = session) {
    const data = await api.fetchSchool(nextSession)
    setStore(data)
    const [g, a, days, leaves] = await Promise.all([
      hub.listGroups(),
      hub.listAnnouncements(),
      desk.listTeacherDays(),
      desk.listLeaves(),
    ])
    if (g.ok) setGroups(g.groups)
    if (a.ok) setAnnouncements(a.announcements)
    if (days.ok) setTeacherDays(days.days)
    if (leaves.ok) setTeacherLeaves(leaves.leaves)
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

  function notify(message, tone = 'ok') {
    setToast({ message, tone, id: `${Date.now()}` })
    window.setTimeout(() => setToast(null), 2800)
  }

  async function after(result, okMessage) {
    if (!result.ok) {
      notify(tx(result.error), 'bad')
      return result
    }
    await refresh()
    if (okMessage) notify(okMessage)
    return result
  }

  async function login(email, password) {
    const result = await api.loginStaff(email, password)
    if (!result.ok) return result
    setSession(result.session)
    saveSession(result.session)
    await refresh(result.session)
    return { ok: true }
  }

  function logout() {
    setSession(null)
    saveSession(null)
  }

  async function createTeacher(payload) {
    if (!user) return { ok: false, error: t('errSignIn') }
    return after(await api.insertTeacher(payload, user), t('toastTeacherCreated'))
  }

  async function updateTeacherStatus(id, status) {
    const teacher = store.teachers.find((t) => t.id === id)
    if (!teacher) return
    return after(await api.setTeacherStatus(id, status, user, teacher.name), status === 'blocked' ? t('toastTeacherBlocked') : t('toastTeacherRestored'))
  }

  async function deleteTeacher(id) {
    const teacher = store.teachers.find((t) => t.id === id)
    if (!teacher) return
    return after(await api.removeTeacher(id, user, teacher.name), t('toastTeacherDeleted'))
  }

  async function createSubUser(payload) {
    return after(await api.insertSubUser(payload, user), t('toastSubCreated'))
  }

  async function updateSubUserStatus(id, status) {
    const sub = store.subUsers.find((s) => s.id === id)
    if (!sub) return
    return after(await api.setSubUserStatus(id, status, user, sub.name), status === 'blocked' ? t('toastSubBlocked') : t('toastSubRestored'))
  }

  async function deleteSubUser(id) {
    const sub = store.subUsers.find((s) => s.id === id)
    if (!sub) return
    return after(await api.removeSubUser(id, user, sub.name), t('toastSubDeleted'))
  }

  async function updateMadamAccount({ name, email, currentPassword, newPassword }) {
    if (user?.role !== 'madam') return { ok: false, error: t('errOnlyMadam') }
    if (user.password !== currentPassword) return { ok: false, error: t('errBadPassword') }
    const result = await api.updateMadam(user.id, { name, email, password: newPassword || user.password }, user)
    return after(result, t('toastMadamUpdated'))
  }

  async function createClass(gradeName, sectionName) {
    return after(await api.insertClass(gradeName, sectionName, user), t('toastClassCreated'))
  }

  async function deleteClass(gradeId, sectionId) {
    const label = classLabel(store.grades, gradeId, sectionId)
    return after(await api.removeClass(gradeId, sectionId, user, label), t('toastClassDeleted'))
  }

  async function createStudent(gradeId, sectionId, payload) {
    return after(
      await api.insertStudent(gradeId, sectionId, payload, user, classLabel(store.grades, gradeId, sectionId)),
      t('toastStudentAdded'),
    )
  }

  async function updateStudent(id, payload) {
    const current = store.students.find((s) => s.id === id)
    if (!current) return { ok: false, error: t('errStudentMissing') }
    return after(await api.patchStudent(id, { ...current, ...payload }, user), t('toastStudentUpdated'))
  }

  async function deleteStudent(id) {
    const student = store.students.find((s) => s.id === id)
    if (!student) return
    return after(await api.removeStudent(id, user, student.name), t('toastStudentDeleted'))
  }

  async function assignClass(teacherId, gradeId, sectionId) {
    const teacher = store.teachers.find((t) => t.id === teacherId)
    if (!teacher) return { ok: false, error: t('errTeacherMissing') }
    return after(
      await api.insertAssignment(teacherId, gradeId, sectionId, user, classLabel(store.grades, gradeId, sectionId), teacher.name),
      t('toastAssigned'),
    )
  }

  async function hideAssignment(id, hidden) {
    const assignment = store.assignments.find((a) => a.id === id)
    if (!assignment) return
    const teacher = store.teachers.find((t) => t.id === assignment.teacherId)
    return after(
      await api.setAssignmentHidden(id, hidden, user, classLabel(store.grades, assignment.gradeId, assignment.sectionId), teacher?.name || 'teacher'),
      hidden ? t('toastHidden') : t('toastShown'),
    )
  }

  async function unassignClass(id) {
    const assignment = store.assignments.find((a) => a.id === id)
    if (!assignment) return
    const teacher = store.teachers.find((t) => t.id === assignment.teacherId)
    return after(
      await api.removeAssignment(id, user, classLabel(store.grades, assignment.gradeId, assignment.sectionId), teacher?.name || 'teacher'),
      t('toastUnassigned'),
    )
  }

  const value = {
    store,
    user,
    toast,
    ready,
    bootError,
    boot,
    hasSession: Boolean(session),
    isMadam: user?.role === 'madam',
    login,
    logout,
    createTeacher,
    updateTeacherStatus,
    deleteTeacher,
    createSubUser,
    updateSubUserStatus,
    deleteSubUser,
    updateMadamAccount,
    createClass,
    deleteClass,
    createStudent,
    updateStudent,
    deleteStudent,
    assignClass,
    hideAssignment,
    unassignClass,
    async saveAttendance({ date, gradeId, sectionId, marks }) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await api.upsertAttendance({ date, gradeId, sectionId, marks, teacher: user })
      if (!result.ok) {
        notify(tx(result.error), 'bad')
        return result
      }
      await refresh()
      notify(result.created ? t('toastCreated') : date === todayKey() ? t('toastToday') : t('toastUpdated'))
      return result
    },
    async reviewLeave(id, status) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await desk.reviewLeave(id, status, user)
      if (!result.ok) {
        notify(tx(result.error), 'bad')
        return result
      }
      const leaves = await desk.listLeaves()
      if (leaves.ok) setTeacherLeaves(leaves.leaves)
      notify(status === 'approved' ? t('toastLeaveApproved') : t('toastLeaveRejected'))
      return result
    },
    groups,
    announcements,
    teacherDays,
    teacherLeaves,
    loadMessages: hub.listMessages,
    loadDmMessages: hub.listDmMessages,
    openDmThread: hub.openDmThread,
    async postDmMessage(payload) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await hub.postDmMessage(payload, user)
      if (!result.ok) notify(tx(result.error), 'bad')
      return result
    },
    async createGroup(payload) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await hub.createGroup(payload, user)
      if (!result.ok) {
        notify(tx(result.error), 'bad')
        return result
      }
      const g = await hub.listGroups()
      if (g.ok) setGroups(g.groups)
      notify(t('toastGroupCreated'))
      return result
    },
    async updateGroupPhoto(id, photo) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await hub.updateGroupPhoto(id, photo)
      if (!result.ok) {
        notify(tx(result.error), 'bad')
        return result
      }
      const g = await hub.listGroups()
      if (g.ok) setGroups(g.groups)
      notify(t('toastGroupPhoto'))
      return result
    },
    async postGroupMessage(payload) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await hub.postMessage(payload, user)
      if (!result.ok) notify(tx(result.error), 'bad')
      return result
    },
    async deleteGroupMessage(id) {
      const result = await hub.deleteMessage(id)
      if (!result.ok) notify(tx(result.error), 'bad')
      return result
    },
    async postAnnouncement(payload) {
      if (!user) return { ok: false, error: t('errSignIn') }
      const result = await hub.postAnnouncement(payload, user)
      if (!result.ok) {
        notify(tx(result.error), 'bad')
        return result
      }
      const a = await hub.listAnnouncements()
      if (a.ok) setAnnouncements(a.announcements)
      notify(t('toastAnnouncePosted'))
      return result
    },
    async deleteAnnouncement(id) {
      const result = await hub.deleteAnnouncement(id)
      if (result.ok) {
        const a = await hub.listAnnouncements()
        if (a.ok) setAnnouncements(a.announcements)
      }
      return result
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
