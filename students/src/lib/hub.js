import { createDmApi } from './dm'
import { createStudentLeaveApi } from './studentLeave'

function parseMarks(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value) || {}
  } catch {
    return {}
  }
}

function mapStudent(row) {
  return {
    id: row.id,
    name: row.name,
    role: 'student',
    email: row.login_email || '',
    gradeId: row.grade_id,
    sectionId: row.section_id,
    age: row.age || '',
    gender: row.gender || '',
    dob: row.dob || '',
    nic: row.nic || '',
    rollNo: row.roll_no || '',
    bloodGroup: row.blood_group || '',
    address: row.address || '',
    parentName: row.parent_name || '',
    parentPhone: row.parent_phone || '',
    parentEmail: row.parent_email || '',
    emergencyPhone: row.emergency_phone || '',
    notes: row.notes || '',
    photo: row.photo || '',
    tagCode: row.tag_code || row.id,
  }
}

export function createHub(rest) {
  function mapGroup(row) {
    return { id: row.id, name: row.name, scope: row.scope, gradeId: row.grade_id, sectionId: row.section_id || '', photo: row.photo || '', createdByName: row.created_by_name || '', createdAt: row.created_at }
  }
  function mapMessage(row) {
    return { id: row.id, groupId: row.group_id, authorId: row.author_id, authorName: row.author_name, authorRole: row.author_role, body: row.body || '', fileName: row.file_name || '', fileType: row.file_type || '', fileData: row.file_data || '', createdAt: row.created_at }
  }
  function mapAnnounce(row) {
    return { id: row.id, title: row.title, body: row.body || '', authorId: row.author_id, authorName: row.author_name, authorRole: row.author_role, createdAt: row.created_at }
  }
  return {
    ...createDmApi(rest),
    ...createStudentLeaveApi(rest),
    async listGroups() {
      const res = await rest.get('nfctag_groups', '?select=*&order=created_at.desc&limit=200')
      if (res.error) return { ok: false, error: res.error.message, groups: [] }
      return { ok: true, groups: (res.data || []).map(mapGroup) }
    },
    async listMessages(groupId) {
      const res = await rest.get('nfctag_group_messages', `?select=*&group_id=eq.${groupId}&order=created_at.asc&limit=400`)
      if (res.error) return { ok: false, error: res.error.message, messages: [] }
      return { ok: true, messages: (res.data || []).map(mapMessage) }
    },
    async postMessage({ groupId, body, fileName, fileType, fileData }, user) {
      if (!body?.trim() && !fileData) return { ok: false, error: 'Write a message or attach a file.' }
      const res = await rest.insert('nfctag_group_messages', { group_id: groupId, author_id: user.id, author_name: user.name, author_role: user.role, body: (body || '').trim(), file_name: fileName || null, file_type: fileType || null, file_data: fileData || null })
      if (res.error) return { ok: false, error: res.error.message }
      return { ok: true }
    },
    async listAnnouncements() {
      const res = await rest.get('nfctag_announcements', '?select=*&order=created_at.desc&limit=80')
      if (res.error) return { ok: false, error: res.error.message, announcements: [] }
      return { ok: true, announcements: (res.data || []).map(mapAnnounce) }
    },
    async loginStudent(email, password) {
      const e = email.trim().toLowerCase()
      const res = await rest.get('nfctag_students', `?select=*&login_email=eq.${encodeURIComponent(e)}&limit=1`)
      if (res.error) return { ok: false, error: res.error.message }
      const row = (res.data || [])[0]
      if (!row || row.password !== password) return { ok: false, error: 'Email or password is incorrect.' }
      return { ok: true, student: mapStudent(row) }
    },
    async fetchStudent(id) {
      const res = await rest.get('nfctag_students', `?select=*&id=eq.${id}&limit=1`)
      if (res.error) return { ok: false, error: res.error.message }
      const row = (res.data || [])[0]
      if (!row) return { ok: false, error: 'Student not found.' }
      return { ok: true, student: mapStudent(row) }
    },
    async fetchPublicStudent(code) {
      const key = String(code || '').trim()
      if (!key) return { ok: false, error: 'Missing child code.' }
      // Prefer tag_code when column exists; fall back to id (UUID).
      let res = await rest.get(
        'nfctag_students',
        `?select=id,name,photo,parent_name,parent_phone,emergency_phone,blood_group,notes,grade_id,section_id,tag_code&or=(tag_code.eq.${encodeURIComponent(key)},id.eq.${encodeURIComponent(key)})&limit=1`,
      )
      if (res.error) {
        res = await rest.get('nfctag_students', `?select=*&id=eq.${encodeURIComponent(key)}&limit=1`)
      }
      if (res.error) return { ok: false, error: res.error.message }
      const row = (res.data || [])[0]
      if (!row) return { ok: false, error: 'Child not found.' }
      return { ok: true, student: mapStudent(row) }
    },
    async listMyAttendance(gradeId, sectionId, studentId) {
      const res = await rest.get(
        'nfctag_attendance',
        `?select=id,attend_date,grade_id,section_id,teacher_name,marks&grade_id=eq.${gradeId}&section_id=eq.${sectionId}&order=attend_date.desc&limit=5000`,
      )
      if (res.error) return { ok: false, error: res.error.message, records: [] }
      const records = (res.data || []).map((row) => {
        const marks = parseMarks(row.marks)
        return {
          id: row.id,
          date: String(row.attend_date || '').slice(0, 10),
          teacherName: row.teacher_name || '',
          status: marks[studentId] || '',
        }
      })
      return { ok: true, records }
    },
    async fetchSchool() {
      const [grades, sections] = await Promise.all([
        rest.get('nfctag_grades', '?select=*&order=name.asc'),
        rest.get('nfctag_sections', '?select=*&order=name.asc'),
      ])
      if (grades.error) throw grades.error
      if (sections.error) throw sections.error
      return {
        grades: (grades.data || []).map((grade) => ({
          id: grade.id,
          name: grade.name,
          sections: (sections.data || []).filter((s) => s.grade_id === grade.id).map((s) => ({ id: s.id, name: s.name })),
        })),
      }
    },
  }
}
