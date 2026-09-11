import { createDmApi } from './dm'

function mapGroup(row) {
  return {
    id: row.id,
    name: row.name,
    scope: row.scope,
    gradeId: row.grade_id,
    sectionId: row.section_id || '',
    photo: row.photo || '',
    createdByName: row.created_by_name || '',
    createdByRole: row.created_by_role || '',
    createdAt: row.created_at,
  }
}

function mapMessage(row) {
  return {
    id: row.id,
    groupId: row.group_id,
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

function mapAnnounce(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body || '',
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    createdAt: row.created_at,
  }
}

export function createHub(rest) {
  return {
    ...createDmApi(rest),
    async listGroups() {
      const res = await rest.get('nfctag_groups', '?select=*&order=created_at.desc&limit=200')
      if (res.error) return { ok: false, error: res.error.message, groups: [] }
      return { ok: true, groups: (res.data || []).map(mapGroup) }
    },

    async createGroup({ name, gradeId, sectionId, scope, photo }, user) {
      const row = {
        name: name.trim(),
        scope: sectionId ? 'section' : 'grade',
        grade_id: gradeId,
        section_id: sectionId || null,
        photo: photo || null,
        created_by: user.id,
        created_by_name: user.name,
        created_by_role: user.role,
      }
      const res = await rest.insert('nfctag_groups', row)
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true, group: mapGroup((res.data || [])[0] || row) }
    },

    async updateGroupPhoto(id, photo) {
      if (!id) return { ok: false, error: 'Group is required.' }
      const res = await rest.patch('nfctag_groups', `?id=eq.${id}`, { photo: photo || null })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true, group: mapGroup((res.data || [])[0] || { id, photo }) }
    },

    async listMessages(groupId) {
      const res = await rest.get(
        'nfctag_group_messages',
        `?select=*&group_id=eq.${groupId}&order=created_at.asc&limit=400`,
      )
      if (res.error) return { ok: false, error: res.error.message, messages: [] }
      return { ok: true, messages: (res.data || []).map(mapMessage) }
    },

    async postMessage({ groupId, body, fileName, fileType, fileData }, user) {
      if (!body?.trim() && !fileData) return { ok: false, error: 'Write a message or attach a file.' }
      const res = await rest.insert('nfctag_group_messages', {
        group_id: groupId,
        author_id: user.id,
        author_name: user.name,
        author_role: user.role,
        body: (body || '').trim(),
        file_name: fileName || null,
        file_type: fileType || null,
        file_data: fileData || null,
      })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async deleteMessage(id) {
      const res = await rest.remove('nfctag_group_messages', `?id=eq.${id}`)
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async listAnnouncements() {
      const res = await rest.get('nfctag_announcements', '?select=*&order=created_at.desc&limit=80')
      if (res.error) return { ok: false, error: res.error.message, announcements: [] }
      return { ok: true, announcements: (res.data || []).map(mapAnnounce) }
    },

    async postAnnouncement({ title, body }, user) {
      if (!title?.trim()) return { ok: false, error: 'Title is required.' }
      const res = await rest.insert('nfctag_announcements', {
        title: title.trim(),
        body: (body || '').trim(),
        author_id: user.id,
        author_name: user.name,
        author_role: user.role,
      })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async deleteAnnouncement(id) {
      const res = await rest.remove('nfctag_announcements', `?id=eq.${id}`)
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },

    async loginStudent(email, password) {
      const e = email.trim().toLowerCase()
      const res = await rest.get(
        'nfctag_students',
        `?select=id,name,grade_id,section_id,login_email,password,photo,roll_no&login_email=eq.${encodeURIComponent(e)}&limit=1`,
      )
      if (res.error) return { ok: false, error: res.error.message }
      const row = (res.data || [])[0]
      if (!row || row.password !== password) return { ok: false, error: 'Email or password is incorrect.' }
      return {
        ok: true,
        student: {
          id: row.id,
          name: row.name,
          role: 'student',
          email: row.login_email,
          gradeId: row.grade_id,
          sectionId: row.section_id,
          photo: row.photo || '',
          rollNo: row.roll_no || '',
        },
      }
    },
  }
}
