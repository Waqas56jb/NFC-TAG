import { extractTagCodeFromText, normalizeTagCode } from './nfcTag'

export const LEAVE_TYPES = [
  { id: 'restroom', icon: 'restroom' },
  { id: 'administration', icon: 'admin' },
  { id: 'clinic', icon: 'clinic' },
  { id: 'library', icon: 'library' },
  { id: 'leave_school', icon: 'exit' },
  { id: 'other', icon: 'other' },
]

/** In-school movement — logged by teacher NFC, view-only for student/parent. */
export const MOVEMENT_TYPES = LEAVE_TYPES.filter((t) => t.id !== 'leave_school')

/** Only this type can be requested by parent/student. */
export const SCHOOL_LEAVE_TYPE = 'leave_school'

/** DB keeps legacy statuses; UI treats approved = currently out. */
export const OUT_STATUSES = ['approved', 'out', 'pending']

function mapLeave(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    studentPhoto: row.student_photo || '',
    gradeId: row.grade_id || '',
    sectionId: row.section_id || '',
    gradeName: row.grade_name || '',
    sectionName: row.section_name || '',
    leaveType: row.leave_type,
    note: row.note || '',
    status: row.status,
    leftAt: row.left_at || '',
    returnedAt: row.returned_at || '',
    reviewedBy: row.reviewed_by || '',
    reviewedByName: row.reviewed_by_name || '',
    reviewedByRole: row.reviewed_by_role || '',
    reviewedAt: row.reviewed_at || '',
    createdAt: row.created_at,
  }
}

function mapStudent(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name || '',
    photo: row.photo || '',
    gradeId: row.grade_id || '',
    sectionId: row.section_id || '',
    tagCode: row.tag_code || '',
  }
}

function isOpenOut(leave) {
  if (!leave) return false
  if (leave.returnedAt || leave.status === 'returned' || leave.status === 'rejected') return false
  // Pending leave-school is a request awaiting approval, not an active exit log.
  if (leave.leaveType === 'leave_school' && leave.status === 'pending') return false
  return OUT_STATUSES.includes(leave.status) || Boolean(leave.leftAt)
}

async function resolveStudentByTag(rest, rawInput) {
  const fromUrl = extractTagCodeFromText(rawInput)
  const code = fromUrl || normalizeTagCode(rawInput)
  if (!code) return { ok: false, error: 'Scan or enter a student NFC code.' }

  let res = await rest.get(
    'nfctag_students',
    `?select=*&tag_code=eq.${encodeURIComponent(code)}&limit=1`,
  )
  if ((!res.error && !(res.data || []).length) || res.error) {
    res = await rest.get(
      'nfctag_students',
      `?select=*&tag_code=ilike.${encodeURIComponent(code)}&limit=1`,
    )
  }
  if (res.error) return { ok: false, error: res.error.message }
  const student = mapStudent((res.data || [])[0])
  if (!student) return { ok: false, error: 'No student matches this NFC tag.' }
  return { ok: true, student, code }
}

async function classNames(rest, gradeId, sectionId) {
  let gradeName = ''
  let sectionName = ''
  if (gradeId) {
    const g = await rest.get('nfctag_grades', `?select=name&id=eq.${encodeURIComponent(gradeId)}&limit=1`)
    gradeName = g.data?.[0]?.name || ''
  }
  if (sectionId) {
    const s = await rest.get('nfctag_sections', `?select=name&id=eq.${encodeURIComponent(sectionId)}&limit=1`)
    sectionName = s.data?.[0]?.name || ''
  }
  return { gradeName, sectionName }
}

export function createStudentLeaveApi(rest) {
  const api = {
    async listStudentLeaves({ studentId, gradeId, sectionId, status } = {}) {
      let q = '?select=*&order=created_at.desc&limit=400'
      if (studentId) q += `&student_id=eq.${encodeURIComponent(studentId)}`
      if (gradeId) q += `&grade_id=eq.${encodeURIComponent(gradeId)}`
      if (sectionId) q += `&section_id=eq.${encodeURIComponent(sectionId)}`
      if (status) q += `&status=eq.${encodeURIComponent(status)}`
      const res = await rest.get('nfctag_student_leaves', q)
      if (res.error) return { ok: false, error: res.error.message, leaves: [] }
      return { ok: true, leaves: (res.data || []).map(mapLeave) }
    },

    /**
     * Teacher NFC scan:
     * - If student is currently out → mark returned (time stamped)
     * - Else → record left class now (no approve/reject)
     */
    async recordNfcLeaveScan(rawInput, { leaveType = 'other', note = '' } = {}, user) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      const found = await resolveStudentByTag(rest, rawInput)
      if (!found.ok) return found
      return api.recordStudentLeaveById(found.student.id, { leaveType, note }, user, found.student)
    },

    /**
     * Teacher taps a student in class (or NFC):
     * - If currently out → mark returned with timestamp
     * - Else → log left class now (default restroom)
     */
    async recordStudentLeaveById(studentId, { leaveType = 'restroom', note = '' } = {}, user, knownStudent = null) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      if (!studentId) return { ok: false, error: 'Student required.' }

      let student = knownStudent
      if (!student) {
        const res = await rest.get(
          'nfctag_students',
          `?select=*&id=eq.${encodeURIComponent(studentId)}&limit=1`,
        )
        if (res.error) return { ok: false, error: res.error.message }
        student = mapStudent((res.data || [])[0])
      }
      if (!student) return { ok: false, error: 'Student not found.' }

      const openRes = await rest.get(
        'nfctag_student_leaves',
        `?select=*&student_id=eq.${encodeURIComponent(student.id)}&order=created_at.desc&limit=8`,
      )
      if (openRes.error) return { ok: false, error: openRes.error.message }
      const open = (openRes.data || []).map(mapLeave).find(isOpenOut)

      if (open) {
        const now = new Date().toISOString()
        const res = await rest.patch('nfctag_student_leaves', `?id=eq.${open.id}`, {
          status: 'returned',
          returned_at: now,
          reviewed_by: user.id,
          reviewed_by_name: user.name,
          reviewed_by_role: user.role || 'teacher',
          reviewed_at: now,
        })
        if (res.error) return { ok: false, error: res.error.message }
        await rest.insert('nfctag_notifications', {
          user_id: student.id,
          role: 'student',
          title: 'Return recorded',
          body: `Back in class · ${user.name}`,
          kind: 'student_leave',
        })
        return {
          ok: true,
          action: 'returned',
          student,
          leave: { ...open, status: 'returned', returnedAt: now, reviewedByName: user.name },
        }
      }

      const type = MOVEMENT_TYPES.some((t) => t.id === leaveType) ? leaveType : 'restroom'
      const { gradeName, sectionName } = await classNames(rest, student.gradeId, student.sectionId)
      const now = new Date().toISOString()
      const res = await rest.insert('nfctag_student_leaves', {
        student_id: student.id,
        student_name: student.name,
        student_photo: student.photo || null,
        grade_id: student.gradeId || null,
        section_id: student.sectionId || null,
        grade_name: gradeName,
        section_name: sectionName,
        leave_type: type,
        note: (note || '').trim(),
        status: 'approved',
        left_at: now,
        reviewed_by: user.id,
        reviewed_by_name: user.name,
        reviewed_by_role: user.role || 'teacher',
        reviewed_at: now,
      })
      if (res.error) return { ok: false, error: res.error.message }
      const leave = mapLeave((res.data || [])[0] || {})
      await rest.insert('nfctag_notifications', {
        user_id: student.id,
        role: 'student',
        title: 'Left class',
        body: `${type.replaceAll('_', ' ')} · ${user.name}`,
        kind: 'student_leave',
      })
      return { ok: true, action: 'left', student, leave }
    },

    async markStudentReturned(id, user) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      const found = await rest.get('nfctag_student_leaves', `?select=*&id=eq.${id}&limit=1`)
      if (found.error) return { ok: false, error: found.error.message }
      const row = (found.data || [])[0]
      if (!row) return { ok: false, error: 'Leave record not found.' }
      const leave = mapLeave(row)
      if (!isOpenOut(leave)) return { ok: false, error: 'This student is already returned.' }
      const now = new Date().toISOString()
      const res = await rest.patch('nfctag_student_leaves', `?id=eq.${id}`, {
        status: 'returned',
        returned_at: now,
        reviewed_by: user.id,
        reviewed_by_name: user.name,
        reviewed_by_role: user.role || 'teacher',
        reviewed_at: now,
      })
      if (res.error) return { ok: false, error: res.error.message }
      await rest.insert('nfctag_notifications', {
        user_id: row.student_id,
        role: 'student',
        title: 'Return recorded',
        body: `Back in class · ${user.name}`,
        kind: 'student_leave',
      })
      return { ok: true }
    },

    /**
     * Parent/student request — only for leaving school.
     * Restroom / clinic / etc. are teacher NFC time logs, not requests.
     */
    async requestStudentLeave({ leaveType, note, gradeName, sectionName }, student) {
      if (!student?.id) return { ok: false, error: 'Sign in first.' }
      if (leaveType !== 'leave_school') {
        return { ok: false, error: 'Only “Leave school” can be requested. Other exits are logged by teacher NFC scan.' }
      }
      const res = await rest.insert('nfctag_student_leaves', {
        student_id: student.id,
        student_name: student.name,
        student_photo: student.photo || null,
        grade_id: student.gradeId || null,
        section_id: student.sectionId || null,
        grade_name: gradeName || '',
        section_name: sectionName || '',
        leave_type: 'leave_school',
        note: (note || '').trim(),
        status: 'pending',
      })
      if (res.error) return { ok: false, error: res.error.message }
      const leave = mapLeave((res.data || [])[0] || {})
      const body = `${student.name} · leave school${(note || '').trim() ? ` · ${note.trim()}` : ''}`

      const madams = await rest.get('nfctag_madam', '?select=id,name')
      for (const m of madams.data || []) {
        await rest.insert('nfctag_notifications', {
          user_id: m.id,
          role: 'madam',
          title: 'Leave school request',
          body,
          kind: 'student_leave',
        })
      }
      if (student.gradeId && student.sectionId) {
        const assigns = await rest.get(
          'nfctag_assignments',
          `?select=teacher_id,hidden&grade_id=eq.${encodeURIComponent(student.gradeId)}&section_id=eq.${encodeURIComponent(student.sectionId)}`,
        )
        const teacherIds = [
          ...new Set(
            (assigns.data || [])
              .filter((a) => !a.hidden)
              .map((a) => a.teacher_id)
              .filter(Boolean),
          ),
        ]
        for (const teacherId of teacherIds) {
          await rest.insert('nfctag_notifications', {
            user_id: teacherId,
            role: 'teacher',
            title: 'Leave school request',
            body,
            kind: 'student_leave',
          })
        }
      }
      return { ok: true, leave }
    },

    async reviewStudentLeave(id, status, user) {
      if (status === 'returned') return this.markStudentReturned(id, user)
      if (!['approved', 'rejected'].includes(status)) {
        return { ok: false, error: 'Invalid leave action.' }
      }
      const found = await rest.get('nfctag_student_leaves', `?select=*&id=eq.${id}&limit=1`)
      if (found.error) return { ok: false, error: found.error.message }
      const row = (found.data || [])[0]
      if (!row) return { ok: false, error: 'Leave request not found.' }
      if (row.leave_type !== 'leave_school') {
        return { ok: false, error: 'Only leave-school requests are approved. Other exits use NFC scan.' }
      }
      if (row.status !== 'pending') return { ok: false, error: 'This request was already decided.' }

      const now = new Date().toISOString()
      const patch = {
        status,
        reviewed_by: user.id,
        reviewed_by_name: String(user.name || '')
          .replace(/\bmadam\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim() || (user.role === 'madam' ? 'Principal' : user.name),
        reviewed_by_role: user.role || 'staff',
        reviewed_at: now,
      }
      if (status === 'approved') patch.left_at = now

      const res = await rest.patch('nfctag_student_leaves', `?id=eq.${id}`, patch)
      if (res.error) return { ok: false, error: res.error.message }
      await rest.insert('nfctag_notifications', {
        user_id: row.student_id,
        role: 'student',
        title: status === 'approved' ? 'Leave school approved' : 'Leave school rejected',
        body: `${user.name || 'Principal'}${row.note ? ` · ${row.note}` : ''}`,
        kind: 'student_leave',
      })
      return { ok: true }
    },
  }
  return api
}
