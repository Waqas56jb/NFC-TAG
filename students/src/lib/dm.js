/** Direct-message helpers shared into each app hub. */
export function createDmApi(rest) {
  function mapThread(row) {
    return {
      id: row.id,
      staffId: row.staff_id,
      staffRole: row.staff_role,
      staffName: row.staff_name || '',
      studentId: row.student_id,
      studentName: row.student_name || '',
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
    }
  }

  function mapDm(row) {
    return {
      id: row.id,
      threadId: row.thread_id,
      authorId: row.author_id,
      authorName: row.author_name,
      authorRole: row.author_role,
      body: row.body || '',
      fileName: row.file_name || '',
      fileType: row.file_type || '',
      fileData: row.file_data || '',
      createdAt: row.created_at,
    }
  }

  return {
    async openDmThread({ staffId, staffRole, staffName, studentId, studentName }) {
      if (!staffId || !studentId) return { ok: false, error: 'Staff and student are required.' }
      const role = staffRole || 'teacher'
      const q = `?select=*&staff_id=eq.${encodeURIComponent(staffId)}&staff_role=eq.${encodeURIComponent(role)}&student_id=eq.${studentId}&limit=1`
      const existing = await rest.get('nfctag_dm_threads', q)
      if (existing.error) return { ok: false, error: existing.error.message }
      if (existing.data?.[0]) return { ok: true, thread: mapThread(existing.data[0]) }
      const res = await rest.insert('nfctag_dm_threads', {
        staff_id: staffId,
        staff_role: role,
        staff_name: staffName || '',
        student_name: studentName || '',
        student_id: studentId,
      })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true, thread: mapThread((res.data || [])[0]) }
    },

    async listDmThreadsForStudent(studentId) {
      const res = await rest.get(
        'nfctag_dm_threads',
        `?select=*&student_id=eq.${studentId}&order=last_message_at.desc&limit=100`,
      )
      if (res.error) return { ok: false, error: res.error.message, threads: [] }
      return { ok: true, threads: (res.data || []).map(mapThread) }
    },

    async listDmThreadsForStaff(staffId, staffRole) {
      const res = await rest.get(
        'nfctag_dm_threads',
        `?select=*&staff_id=eq.${encodeURIComponent(staffId)}&staff_role=eq.${encodeURIComponent(staffRole)}&order=last_message_at.desc&limit=100`,
      )
      if (res.error) return { ok: false, error: res.error.message, threads: [] }
      return { ok: true, threads: (res.data || []).map(mapThread) }
    },

    async listDmMessages(threadId) {
      const res = await rest.get(
        'nfctag_dm_messages',
        `?select=*&thread_id=eq.${threadId}&order=created_at.asc&limit=400`,
      )
      if (res.error) return { ok: false, error: res.error.message, messages: [] }
      return { ok: true, messages: (res.data || []).map(mapDm) }
    },

    async postDmMessage({ threadId, body, fileName, fileType, fileData }, user) {
      if (!threadId) return { ok: false, error: 'Chat is required.' }
      if (!body?.trim() && !fileData) return { ok: false, error: 'Write a message or attach a file.' }
      const res = await rest.insert('nfctag_dm_messages', {
        thread_id: threadId,
        author_id: user.id,
        author_name: user.name,
        author_role: user.role,
        body: (body || '').trim(),
        file_name: fileName || null,
        file_type: fileType || null,
        file_data: fileData || null,
      })
      if (res.error) return { ok: false, error: res.error.message }
      await rest.patch('nfctag_dm_threads', `?id=eq.${threadId}`, {
        last_message_at: new Date().toISOString(),
      })
      return { ok: true }
    },
  }
}
