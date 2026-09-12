/** Class homework / assignments for students to view and teachers to post. */
export function createHomeworkApi(rest) {
  function mapHomework(row) {
    return {
      id: row.id,
      teacherId: row.teacher_id || '',
      teacherName: row.teacher_name || '',
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

    async createHomework({ title, body, dueAt, gradeId, sectionId, fileName, fileType, fileData }, user) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      if (user.role === 'student') return { ok: false, error: 'Only teachers can post assignments.' }
      const trimmed = String(title || '').trim()
      if (!trimmed) return { ok: false, error: 'Add a title.' }
      if (!gradeId || !sectionId) return { ok: false, error: 'Choose a class.' }
      const res = await rest.insert('nfctag_homework', {
        teacher_id: user.id,
        teacher_name: user.name || '',
        grade_id: gradeId,
        section_id: sectionId,
        title: trimmed,
        body: String(body || '').trim(),
        due_at: dueAt || null,
        file_name: fileName || null,
        file_type: fileType || null,
        file_data: fileData || null,
      })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true, item: mapHomework((res.data || [])[0] || {}) }
    },

    async deleteHomework(id, user) {
      if (!user?.id) return { ok: false, error: 'Sign in first.' }
      if (!id) return { ok: false, error: 'Assignment required.' }
      const res = await rest.remove('nfctag_homework', `?id=eq.${encodeURIComponent(id)}`)
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },
  }
}
