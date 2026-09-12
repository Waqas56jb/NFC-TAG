/** Class homework / assignments for students to view and teachers to post. */
export function createHomeworkApi(rest) {
  function mapHomework(row) {
    return {
      id: row.id,
      teacherId: row.teacher_id || '',
      teacherName: row.teacher_name || '',
      courseName: row.course_name || '',
      gradeId: row.grade_id || '',
      sectionId: row.section_id || '',
      title: row.title || '',
      body: row.body || '',
      dueAt: row.due_at || '',
      fileName: row.file_name || '',
      fileType: row.file_type || '',
      fileData: row.file_data || '',
      createdAt: row.created_at,
    }
  }

  async function notifyClassStudents({ gradeId, sectionId, title, courseName, teacherName }) {
    const students = await rest.get(
      'nfctag_students',
      `?select=id&grade_id=eq.${encodeURIComponent(gradeId)}&section_id=eq.${encodeURIComponent(sectionId)}&limit=500`,
    )
    const rows = students.data || []
    if (!rows.length) return
    const noteTitle = courseName ? `${courseName}: ${title}` : title
    const noteBody = teacherName
      ? `New assignment from ${teacherName}. Open Work to view.`
      : 'New assignment posted. Open Work to view.'
    await Promise.all(
      rows.map((student) =>
        rest.insert('nfctag_notifications', {
          user_id: student.id,
          role: 'student',
          title: noteTitle,
          body: noteBody,
          kind: 'homework',
        }),
      ),
    )
  }

  return {
    async listHomework({ gradeId, sectionId, teacherId } = {}) {
      let q = '?select=*&order=created_at.desc&limit=200'
      if (gradeId) q += `&grade_id=eq.${encodeURIComponent(gradeId)}`
      if (sectionId) q += `&section_id=eq.${encodeURIComponent(sectionId)}`
      if (teacherId) q += `&teacher_id=eq.${encodeURIComponent(teacherId)}`
      const res = await rest.get('nfctag_homework', q)
      if (res.error) return { ok: false, error: res.error.message, homework: [] }
      return { ok: true, homework: (res.data || []).map(mapHomework) }
    },

    async createHomework(
      { title, body, dueAt, gradeId, sectionId, courseName, fileName, fileType, fileData },
      user,
    ) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      if (user.role === 'student') return { ok: false, error: 'Only teachers can post assignments.' }
      const trimmed = String(title || '').trim()
      if (!trimmed) return { ok: false, error: 'Add a title.' }
      if (!gradeId || !sectionId) return { ok: false, error: 'Choose a class.' }
      const course = String(courseName || user.subject || '').trim()
      const payload = {
        teacher_id: user.id,
        teacher_name: user.name || '',
        course_name: course,
        grade_id: gradeId,
        section_id: sectionId,
        title: trimmed,
        body: String(body || '').trim(),
        due_at: dueAt || null,
        file_name: fileName || null,
        file_type: fileType || null,
        file_data: fileData || null,
      }
      let res = await rest.insert('nfctag_homework', payload)
      if (res.error && /course_name/i.test(res.error.message || '')) {
        const { course_name, ...fallback } = payload
        res = await rest.insert('nfctag_homework', fallback)
      }
      if (res.error) return { ok: false, error: res.error.message }
      const item = mapHomework((res.data || [])[0] || { ...payload, id: '', created_at: new Date().toISOString() })
      try {
        await notifyClassStudents({
          gradeId,
          sectionId,
          title: trimmed,
          courseName: course,
          teacherName: user.name || '',
        })
      } catch {
        /* posting succeeded even if notify fails */
      }
      return { ok: true, item }
    },

    async deleteHomework(id, user) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      if (!id) return { ok: false, error: 'Assignment required.' }
      const res = await rest.remove('nfctag_homework', `?id=eq.${encodeURIComponent(id)}`)
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async listStudentNotifications(userId) {
      if (!userId) return { ok: true, notifications: [] }
      const res = await rest.get(
        'nfctag_notifications',
        `?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=80`,
      )
      if (res.error) return { ok: false, error: res.error.message, notifications: [] }
      return {
        ok: true,
        notifications: (res.data || []).map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body || '',
          kind: row.kind || '',
          authorName:
            row.kind === 'homework'
              ? 'Assignment'
              : row.kind === 'leave' || row.kind === 'student_leave'
                ? 'School'
                : 'School',
          authorId: '',
          createdAt: row.created_at,
        })),
      }
    },
  }
}
