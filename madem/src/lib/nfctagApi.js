import { rest } from './rest'

export const emptySchool = {
  madam: { id: '', name: '', email: '', password: '' },
  madams: [],
  subUsers: [],
  teachers: [],
  grades: [],
  students: [],
  assignments: [],
  attendance: [],
  activities: [],
}

function fail(error) {
  return { ok: false, error: error?.message || 'Request failed.' }
}

function mapMadam(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: 'madam',
    createdAt: row.created_at,
  }
}

function mapSub(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapTeacher(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    subject: row.subject || '',
    status: row.status,
    createdById: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }
}

function mapStudent(row) {
  return {
    id: row.id,
    gradeId: row.grade_id,
    sectionId: row.section_id,
    name: row.name,
    age: row.age || '',
    gender: row.gender || '',
    dob: row.dob || '',
    nic: row.nic || '',
    rollNo: row.roll_no || '',
    bloodGroup: row.blood_group || '',
    allergies: row.allergies || '',
    address: row.address || '',
    parentName: row.parent_name || '',
    parentPhone: row.parent_phone || '',
    parentEmail: row.parent_email || '',
    emergencyPhone: row.emergency_phone || '',
    notes: row.notes || '',
    photo: row.photo || '',
    loginEmail: row.login_email || '',
    loginPassword: row.password || '',
    tagCode: row.tag_code || row.id,
    createdById: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }
}

function mapAssignment(row) {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    gradeId: row.grade_id,
    sectionId: row.section_id,
    hidden: Boolean(row.hidden),
    createdById: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }
}

function parseMarks(value) {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) || {}
    } catch {
      return {}
    }
  }
  return value
}

function mapAttendance(row) {
  return {
    id: row.id,
    date: String(row.attend_date || '').slice(0, 10),
    gradeId: row.grade_id,
    sectionId: row.section_id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    marks: parseMarks(row.marks),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }
}

function mapActivity(row) {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    targetName: row.target_name,
    detail: row.detail,
    at: row.at ? new Date(row.at).getTime() : Date.now(),
  }
}

function nestGrades(grades = [], sections = []) {
  return grades.map((grade) => ({
    id: grade.id,
    name: grade.name,
    createdById: grade.created_by,
    createdByName: grade.created_by_name,
    createdAt: grade.created_at,
    sections: sections
      .filter((section) => section.grade_id === grade.id)
      .map((section) => ({
        id: section.id,
        name: section.name,
        createdById: section.created_by,
        createdByName: section.created_by_name,
        createdAt: section.created_at,
      })),
  }))
}

export function createNftagApi(supabase) {
  async function fetchSchool(session) {
    const [madams, subs, teachers, grades, sections, students, assignments, attendance, activities] =
      await Promise.all([
        rest.get('nfctag_madam', '?select=*&order=created_at.asc'),
        rest.get('nfctag_sub_users', '?select=*&order=created_at.asc'),
        rest.get('nfctag_teachers', '?select=*&order=created_at.desc'),
        rest.get('nfctag_grades', '?select=*&order=name.asc'),
        rest.get('nfctag_sections', '?select=*&order=name.asc'),
        rest.get('nfctag_students', '?select=*&order=created_at.desc'),
        rest.get('nfctag_assignments', '?select=*&order=created_at.desc'),
        rest.get(
          'nfctag_attendance',
          '?select=id,attend_date,grade_id,section_id,teacher_id,teacher_name,marks,updated_at&order=attend_date.desc&limit=5000',
          { timeoutMs: 30000 },
        ),
        rest.get('nfctag_activities', '?select=*&order=at.desc&limit=80'),
      ])

    const firstError = [madams, subs, teachers, grades, sections, students, assignments, activities]
      .find((res) => res.error)?.error
    if (firstError) throw firstError

    const madamRows = (madams.data || []).map(mapMadam)
    const currentMadam =
      (session?.role === 'madam' && madamRows.find((m) => m.id === session.id)) || madamRows[0] || emptySchool.madam

    return {
      madam: currentMadam,
      madams: madamRows,
      subUsers: (subs.data || []).map(mapSub),
      teachers: (teachers.data || []).map(mapTeacher),
      grades: nestGrades(grades.data || [], sections.data || []),
      students: (students.data || []).map(mapStudent),
      assignments: (assignments.data || []).map(mapAssignment),
      attendance: (attendance.data || []).map(mapAttendance),
      activities: (activities.data || []).map(mapActivity),
    }
  }

  async function addActivity(user, action, targetType, targetName, detail) {
    if (!user || !supabase) return
    await supabase.from('nfctag_activities').insert({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action,
      target_type: targetType,
      target_name: targetName,
      detail,
    })
  }

  async function emailTaken(email, ignoreId) {
    const e = email.trim().toLowerCase()
    const checks = await Promise.all([
      supabase.from('nfctag_madam').select('id').eq('email', e).maybeSingle(),
      supabase.from('nfctag_sub_users').select('id').eq('email', e).maybeSingle(),
      supabase.from('nfctag_teachers').select('id').eq('email', e).maybeSingle(),
    ])
    return checks.some((res) => res.data && res.data.id !== ignoreId)
  }

  const api = {
    fetchSchool,
    addActivity,
    emailTaken,
    fail,
    async loginStaff(email, password) {
      const e = email.trim().toLowerCase()
      const q = `?select=*&email=eq.${encodeURIComponent(e)}&password=eq.${encodeURIComponent(password)}`
      const madam = await rest.get('nfctag_madam', q)
      if (madam.error) return fail(madam.error)
      if (madam.data?.[0]) return { ok: true, session: { id: madam.data[0].id, role: 'madam' } }

      const sub = await rest.get('nfctag_sub_users', q)
      if (sub.error) return fail(sub.error)
      if (sub.data?.[0]) {
        if (sub.data[0].status === 'blocked') {
          return { ok: false, error: 'This sub-user is blocked. Ask Madam to restore access.' }
        }
        return { ok: true, session: { id: sub.data[0].id, role: 'sub' } }
      }
      return { ok: false, error: 'Email or password is incorrect.' }
    },
    async loginTeacher(email, password) {
      const e = email.trim().toLowerCase()
      const q = `?select=*&email=eq.${encodeURIComponent(e)}&password=eq.${encodeURIComponent(password)}`
      const res = await rest.get('nfctag_teachers', q)
      if (res.error) return fail(res.error)
      if (!res.data?.[0]) return { ok: false, error: 'Email or password is incorrect.' }
      if (res.data[0].status === 'blocked') {
        return { ok: false, error: 'This teacher login is blocked. Ask Madam to restore it.' }
      }
      return {
        ok: true,
        teacher: {
          id: res.data[0].id,
          name: res.data[0].name,
          email: res.data[0].email,
          subject: res.data[0].subject || '',
        },
      }
    },
    async insertTeacher(payload, user) {
      if (await emailTaken(payload.email)) return { ok: false, error: 'This email is already in use.' }
      const { error } = await supabase.from('nfctag_teachers').insert({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        subject: payload.subject.trim(),
        status: 'active',
        created_by: user.id,
        created_by_name: user.name,
      })
      if (error) return fail(error)
      await addActivity(user, 'created', 'teacher', payload.name.trim(), `Created teacher login ${payload.email}`)
      return { ok: true }
    },
    async setTeacherStatus(id, status, user, name) {
      const { error } = await supabase.from('nfctag_teachers').update({ status }).eq('id', id)
      if (error) return fail(error)
      await addActivity(user, status === 'blocked' ? 'blocked' : 'restored', 'teacher', name, `${status} teacher`)
      return { ok: true }
    },
    async removeTeacher(id, user, name) {
      const { error } = await supabase.from('nfctag_teachers').delete().eq('id', id)
      if (error) return fail(error)
      await addActivity(user, 'deleted', 'teacher', name, 'Deleted teacher credentials')
      return { ok: true }
    },
    async insertSubUser(payload, user) {
      if (user.role !== 'madam') return { ok: false, error: 'Only Madam can create sub-users.' }
      if (await emailTaken(payload.email)) return { ok: false, error: 'This email is already in use.' }
      const { error } = await supabase.from('nfctag_sub_users').insert({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        status: 'active',
      })
      if (error) return fail(error)
      await addActivity(user, 'created', 'sub-user', payload.name.trim(), `Created sub-user login ${payload.email}`)
      return { ok: true }
    },
    async setSubUserStatus(id, status, user, name) {
      if (user.role !== 'madam') return { ok: false, error: 'Only Madam can do this.' }
      const { error } = await supabase.from('nfctag_sub_users').update({ status }).eq('id', id)
      if (error) return fail(error)
      await addActivity(user, status === 'blocked' ? 'blocked' : 'restored', 'sub-user', name, `${status} sub-user`)
      return { ok: true }
    },
    async removeSubUser(id, user, name) {
      if (user.role !== 'madam') return
      const { error } = await supabase.from('nfctag_sub_users').delete().eq('id', id)
      if (error) return fail(error)
      await addActivity(user, 'deleted', 'sub-user', name, 'Deleted sub-user credentials')
      return { ok: true }
    },
    async updateMadam(id, { name, email, password }, user) {
      if (await emailTaken(email, id)) return { ok: false, error: 'This email is already in use.' }
      const { error } = await supabase
        .from('nfctag_madam')
        .update({ name: name.trim(), email: email.trim().toLowerCase(), password, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return fail(error)
      await addActivity(user, 'updated', 'madam', name.trim(), 'Updated Madam account details')
      return { ok: true }
    },
    async insertClass(gradeName, sectionName, user) {
      const gName = gradeName.trim()
      const sName = sectionName.trim()
      const existing = await supabase.from('nfctag_grades').select('id,name').ilike('name', gName)
      if (existing.error) return fail(existing.error)
      let gradeId = existing.data.find((g) => g.name.toLowerCase() === gName.toLowerCase())?.id
      if (!gradeId) {
        const created = await supabase
          .from('nfctag_grades')
          .insert({ name: gName, created_by: user.id, created_by_name: user.name })
          .select('id')
          .single()
        if (created.error) return fail(created.error)
        gradeId = created.data.id
      }
      const dup = await supabase.from('nfctag_sections').select('id').eq('grade_id', gradeId).ilike('name', sName)
      if (dup.data?.length) return { ok: false, error: 'This class already exists.' }
      const section = await supabase.from('nfctag_sections').insert({
        grade_id: gradeId,
        name: sName,
        created_by: user.id,
        created_by_name: user.name,
      })
      if (section.error) return fail(section.error)
      await addActivity(user, 'created', 'class', `${gName} Section ${sName}`, `Created class ${gName} Section ${sName}`)
      return { ok: true }
    },
    async removeClass(gradeId, sectionId, user, label) {
      const { error } = await supabase.from('nfctag_sections').delete().eq('id', sectionId)
      if (error) return fail(error)
      const leftover = await supabase.from('nfctag_sections').select('id').eq('grade_id', gradeId)
      if (!leftover.data?.length) {
        await supabase.from('nfctag_grades').delete().eq('id', gradeId)
      }
      await addActivity(user, 'deleted', 'class', label, 'Deleted class card')
      return { ok: true }
    },
    studentRow(gradeId, sectionId, payload, user) {
      return {
        grade_id: gradeId,
        section_id: sectionId,
        name: payload.name.trim(),
        age: String(payload.age || '').trim() || null,
        gender: payload.gender || null,
        dob: payload.dob || null,
        nic: String(payload.nic || '').trim() || null,
        roll_no: String(payload.rollNo || '').trim() || null,
        blood_group: payload.bloodGroup || null,
        allergies: String(payload.allergies || '').trim() || null,
        address: String(payload.address || '').trim() || null,
        parent_name: String(payload.parentName || '').trim() || null,
        parent_phone: String(payload.parentPhone || '').trim() || null,
        parent_email: String(payload.parentEmail || '').trim() || null,
        emergency_phone: String(payload.emergencyPhone || '').trim() || null,
        notes: String(payload.notes || '').trim() || null,
        photo: payload.photo || null,
        created_by: user.id,
        created_by_name: user.name,
      }
    },
    async insertStudent(gradeId, sectionId, payload, user, classLabel) {
      if (!payload.name?.trim()) return { ok: false, error: 'Student name is required.' }
      const row = this.studentRow(gradeId, sectionId, payload, user)
      const base = String(payload.name || 'student')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '') || 'student'
      row.login_email = `${base}@student.nfctag.edu`
      row.password = 'Student@11'
      row.tag_code =
        payload.tagCode ||
        `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase()
      const { data, error } = await supabase.from('nfctag_students').insert(row).select('*').single()
      if (error) {
        // Older DBs without tag_code: retry without the column.
        if (String(error.message || '').includes('tag_code')) {
          delete row.tag_code
          const retry = await supabase.from('nfctag_students').insert(row).select('*').single()
          if (retry.error) return fail(retry.error)
          await addActivity(user, 'created', 'student', payload.name.trim(), `Added student to ${classLabel}`)
          return { ok: true, student: mapStudent(retry.data) }
        }
        return fail(error)
      }
      await addActivity(user, 'created', 'student', payload.name.trim(), `Added student to ${classLabel}`)
      return { ok: true, student: mapStudent(data) }
    },
    async patchStudent(id, payload, user) {
      if (!payload.name?.trim()) return { ok: false, error: 'Student name is required.' }
      const row = this.studentRow(payload.gradeId, payload.sectionId, payload, user)
      delete row.created_by
      delete row.created_by_name
      const { error } = await supabase
        .from('nfctag_students')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return fail(error)
      await addActivity(user, 'updated', 'student', payload.name.trim(), 'Updated student details')
      return { ok: true }
    },
    async removeStudent(id, user, name) {
      const { error } = await supabase.from('nfctag_students').delete().eq('id', id)
      if (error) return fail(error)
      await addActivity(user, 'deleted', 'student', name, 'Deleted student record')
      return { ok: true }
    },
    async insertAssignment(teacherId, gradeId, sectionId, user, label, teacherName) {
      const { error } = await supabase.from('nfctag_assignments').insert({
        teacher_id: teacherId,
        grade_id: gradeId,
        section_id: sectionId,
        hidden: false,
        created_by: user.id,
        created_by_name: user.name,
      })
      if (error) {
        if (String(error.message).includes('duplicate') || error.code === '23505') {
          return { ok: false, error: 'Already assigned.' }
        }
        return fail(error)
      }
      await addActivity(user, 'assigned', 'class', label, `Assigned to ${teacherName}`)
      return { ok: true }
    },
    async setAssignmentHidden(id, hidden, user, label, teacherName) {
      const { error } = await supabase.from('nfctag_assignments').update({ hidden }).eq('id', id)
      if (error) return fail(error)
      await addActivity(user, hidden ? 'hid' : 'showed', 'class', label, `${hidden ? 'Hid' : 'Showed'} class for ${teacherName}`)
      return { ok: true }
    },
    async removeAssignment(id, user, label, teacherName) {
      const { error } = await supabase.from('nfctag_assignments').delete().eq('id', id)
      if (error) return fail(error)
      await addActivity(user, 'unassigned', 'class', label, `Removed from ${teacherName}`)
      return { ok: true }
    },
    async upsertAttendance({ date, gradeId, sectionId, marks, teacher }) {
      if (!date) return { ok: false, error: 'Select a date first.' }
      const existing = await supabase
        .from('nfctag_attendance')
        .select('id')
        .eq('attend_date', date)
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId)
        .maybeSingle()
      if (existing.error) return fail(existing.error)
      const row = {
        attend_date: date,
        grade_id: gradeId,
        section_id: sectionId,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        marks,
        updated_at: new Date().toISOString(),
      }
      const created = !existing.data
      const res = existing.data
        ? await supabase.from('nfctag_attendance').update(row).eq('id', existing.data.id)
        : await supabase.from('nfctag_attendance').insert(row)
      if (res.error) return fail(res.error)
      await addActivity(
        { ...teacher, role: 'teacher' },
        created ? 'created' : 'updated',
        'attendance',
        date,
        created ? `Created attendance for ${date}` : `Updated attendance for ${date}`,
      )
      return { ok: true, created }
    },
  }

  if (!supabase) {
    const missingEnv = {
      message: 'Missing API key. Set VITE_SUPABASE_ANON_KEY in Vercel (API host is nfc-server-gamma).',
    }
    const safe = ['fetchSchool', 'loginStaff', 'loginTeacher', 'fail', 'studentRow']
    return new Proxy(api, {
      get(target, prop) {
        const value = target[prop]
        if (typeof value !== 'function') return value
        if (safe.includes(prop)) return typeof value === 'function' ? value.bind(target) : value
        return async () => fail(missingEnv)
      },
    })
  }

  return api
}
