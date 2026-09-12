function mapDay(row) {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name || '',
    date: String(row.work_date || '').slice(0, 10),
    checkInAt: row.check_in_at || '',
    checkOutAt: row.check_out_at || '',
  }
}

function mapLeave(row) {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name || '',
    startDate: String(row.start_date || '').slice(0, 10),
    endDate: String(row.end_date || '').slice(0, 10),
    reason: row.reason || '',
    status: row.status,
    reviewedByName: row.reviewed_by_name || '',
    reviewedAt: row.reviewed_at || '',
    createdAt: row.created_at,
  }
}

function mapNote(row) {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    title: row.title,
    body: row.body || '',
    kind: row.kind || '',
    authorName: row.kind === 'leave' ? 'Principal' : 'School',
    authorId: '',
    createdAt: row.created_at,
  }
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function createDesk(rest) {
  return {
    async listTeacherDays() {
      const res = await rest.get('nfctag_teacher_days', '?select=*&order=work_date.desc&limit=2000')
      if (res.error) return { ok: false, error: res.error.message, days: [] }
      return { ok: true, days: (res.data || []).map(mapDay) }
    },

    async checkIn(teacher) {
      const date = todayKey()
      const found = await rest.get(
        'nfctag_teacher_days',
        `?select=*&teacher_id=eq.${teacher.id}&work_date=eq.${date}&limit=1`,
      )
      if (found.error) return { ok: false, error: found.error.message }
      const row = (found.data || [])[0]
      if (row?.check_in_at) return { ok: false, error: 'Already checked in today.' }
      const now = new Date().toISOString()
      if (row) {
        const res = await rest.patch('nfctag_teacher_days', `?id=eq.${row.id}`, { check_in_at: now, teacher_name: teacher.name })
        if (res.error) return { ok: false, error: res.error.message }
        return { ok: true }
      }
      const res = await rest.insert('nfctag_teacher_days', {
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        work_date: date,
        check_in_at: now,
      })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async checkOut(teacher) {
      const date = todayKey()
      const found = await rest.get(
        'nfctag_teacher_days',
        `?select=*&teacher_id=eq.${teacher.id}&work_date=eq.${date}&limit=1`,
      )
      if (found.error) return { ok: false, error: found.error.message }
      const row = (found.data || [])[0]
      if (!row?.check_in_at) return { ok: false, error: 'Check in first.' }
      if (row.check_out_at) return { ok: false, error: 'Already checked out today.' }
      const res = await rest.patch('nfctag_teacher_days', `?id=eq.${row.id}`, { check_out_at: new Date().toISOString() })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async listLeaves() {
      const res = await rest.get('nfctag_teacher_leaves', '?select=*&order=created_at.desc&limit=400')
      if (res.error) return { ok: false, error: res.error.message, leaves: [] }
      return { ok: true, leaves: (res.data || []).map(mapLeave) }
    },

    async requestLeave({ startDate, endDate, reason }, teacher) {
      if (!startDate || !endDate) return { ok: false, error: 'Select leave dates.' }
      if (endDate < startDate) return { ok: false, error: 'End date must be after start date.' }
      const res = await rest.insert('nfctag_teacher_leaves', {
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        start_date: startDate,
        end_date: endDate,
        reason: (reason || '').trim(),
        status: 'pending',
      })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async reviewLeave(id, status, user) {
      if (!['approved', 'rejected'].includes(status)) return { ok: false, error: 'Invalid leave decision.' }
      const found = await rest.get('nfctag_teacher_leaves', `?select=*&id=eq.${id}&limit=1`)
      if (found.error) return { ok: false, error: found.error.message }
      const row = (found.data || [])[0]
      if (!row) return { ok: false, error: 'Leave request not found.' }
      const res = await rest.patch('nfctag_teacher_leaves', `?id=eq.${id}`, {
        status,
        reviewed_by: user.id,
        reviewed_by_name: user.name,
        reviewed_at: new Date().toISOString(),
      })
      if (res.error) return { ok: false, error: res.error.message }
      const title = status === 'approved' ? 'Leave approved' : 'Leave rejected'
      const body = `${row.start_date} to ${row.end_date}${row.reason ? ` · ${row.reason}` : ''}`
      await rest.insert('nfctag_notifications', {
        user_id: row.teacher_id,
        role: 'teacher',
        title,
        body,
        kind: 'leave',
      })
      return { ok: true }
    },

    async listNotifications(userId) {
      const res = await rest.get(
        'nfctag_notifications',
        `?select=*&user_id=eq.${userId}&order=created_at.desc&limit=80`,
      )
      if (res.error) return { ok: false, error: res.error.message, notifications: [] }
      return { ok: true, notifications: (res.data || []).map(mapNote) }
    },
  }
}
