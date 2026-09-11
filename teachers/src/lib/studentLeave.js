export const LEAVE_TYPES = [
  { id: 'restroom', icon: 'restroom' },
  { id: 'administration', icon: 'admin' },
  { id: 'clinic', icon: 'clinic' },
  { id: 'library', icon: 'library' },
  { id: 'leave_school', icon: 'exit' },
  { id: 'other', icon: 'other' },
]

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

export function createStudentLeaveApi(rest) {
  return {
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

    async requestStudentLeave({ leaveType, note, gradeName, sectionName }, student) {
      if (!student?.id) return { ok: false, error: 'Sign in first.' }
      if (!LEAVE_TYPES.some((t) => t.id === leaveType)) {
        return { ok: false, error: 'Choose a leave type.' }
      }
      const res = await rest.insert('nfctag_student_leaves', {
        student_id: student.id,
        student_name: student.name,
        student_photo: student.photo || null,
        grade_id: student.gradeId || null,
        section_id: student.sectionId || null,
        grade_name: gradeName || '',
        section_name: sectionName || '',
        leave_type: leaveType,
        note: (note || '').trim(),
        status: 'pending',
      })
      if (res.error) return { ok: false, error: res.error.message }
      const leave = mapLeave((res.data || [])[0] || {})

      const typeLabel = leaveType.replaceAll('_', ' ')
      const body = `${student.name} · ${typeLabel}${(note || '').trim() ? ` · ${note.trim()}` : ''}`

      const madams = await rest.get('nfctag_madam', '?select=id,name')
      for (const m of madams.data || []) {
        await rest.insert('nfctag_notifications', {
          user_id: m.id,
          role: 'madam',
          title: 'Student leave request',
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
            title: 'Student leave request',
            body,
            kind: 'student_leave',
          })
        }
      }

      return { ok: true, leave }
    },

    async reviewStudentLeave(id, status, user) {
      if (!['approved', 'rejected', 'returned'].includes(status)) {
        return { ok: false, error: 'Invalid leave decision.' }
      }
      const found = await rest.get('nfctag_student_leaves', `?select=*&id=eq.${id}&limit=1`)
      if (found.error) return { ok: false, error: found.error.message }
      const row = (found.data || [])[0]
      if (!row) return { ok: false, error: 'Leave request not found.' }

      const patch = {
        status,
        reviewed_by: user.id,
        reviewed_by_name: user.name,
        reviewed_by_role: user.role || 'staff',
        reviewed_at: new Date().toISOString(),
      }
      if (status === 'approved') patch.left_at = new Date().toISOString()
      if (status === 'returned') patch.returned_at = new Date().toISOString()

      const res = await rest.patch('nfctag_student_leaves', `?id=eq.${id}`, patch)
      if (res.error) return { ok: false, error: res.error.message }

      const titles = {
        approved: 'Leave approved',
        rejected: 'Leave rejected',
        returned: 'Return recorded',
      }
      await rest.insert('nfctag_notifications', {
        user_id: row.student_id,
        role: 'student',
        title: titles[status],
        body: `${row.leave_type.replaceAll('_', ' ')}${row.note ? ` · ${row.note}` : ''} · ${user.name}`,
        kind: 'student_leave',
      })
      return { ok: true }
    },
  }
}
