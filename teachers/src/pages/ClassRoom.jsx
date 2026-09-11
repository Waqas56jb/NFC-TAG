import { useMemo, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { Crumbs } from '../components/Crumbs'
import { useTeacher } from '../context/TeacherContext'
import { useI18n } from '../i18n/I18nContext'
import { genderLabel } from '../i18n/helpers'
import { ATTENDANCE_STATUSES, prettyDate, resolveClassRoute, todayKey } from '../lib/school'

function statusKey(id) {
  return `status_${String(id).replaceAll('-', '_')}`
}

function StudentFace({ student }) {
  return student.photo ? (
    <img className="avatar" src={student.photo} alt="" />
  ) : (
    <div className="avatar placeholder">{student.name.slice(0, 1)}</div>
  )
}

function StudentView({ student, t }) {
  const rows = [
    [t('fieldAge'), student.age],
    [t('fieldGender'), genderLabel(student.gender, t)],
    [t('fieldDob'), student.dob],
    [t('fieldNic'), student.nic],
    [t('fieldRoll'), student.rollNo],
    [t('fieldBlood'), student.bloodGroup],
    [t('fieldParent'), student.parentName],
    [t('fieldParentPhone'), student.parentPhone],
    [t('fieldParentEmail'), student.parentEmail],
    [t('fieldEmergency'), student.emergencyPhone],
    [t('fieldAddress'), student.address],
    [t('fieldNotes'), student.notes],
  ]
  return (
    <div className="student-view">
      <div className="photo-pick">
        {student.photo ? (
          <img className="avatar-lg" src={student.photo} alt={student.name} />
        ) : (
          <div className="avatar-lg placeholder">{student.name.slice(0, 1)}</div>
        )}
        <div>
          <strong>{student.name}</strong>
          <p className="muted">{t('readOnly')}</p>
        </div>
      </div>
      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function ClassRoom() {
  const { gradeSlug, sectionSlug } = useParams()
  const location = useLocation()
  const { t, lang } = useI18n()
  const { school, canOpen, saveAttendance } = useTeacher()
  const match = resolveClassRoute(school.grades, gradeSlug, sectionSlug)
  const gradeId = match?.gradeId
  const sectionId = match?.sectionId
  const [tab, setTab] = useState('attendance')
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState(null)
  const [date, setDate] = useState(todayKey())
  const [newDate, setNewDate] = useState(todayKey())
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [notice, setNotice] = useState('')

  const allowed = gradeId && sectionId ? canOpen(gradeId, sectionId) : false
  const students = useMemo(
    () =>
      (school.students || []).filter((s) => s.gradeId === gradeId && s.sectionId === sectionId),
    [school.students, gradeId, sectionId],
  )

  const sheet = (school.attendance || []).find(
    (a) => a.gradeId === gradeId && a.sectionId === sectionId && a.date === date,
  )

  const [marks, setMarks] = useState(null)
  const currentMarks = {
    ...defaultMarks(students),
    ...(marks && marks.date === date ? marks.values : sheet?.marks || {}),
  }

  const history = useMemo(
    () =>
      (school.attendance || [])
        .filter((a) => a.gradeId === gradeId && a.sectionId === sectionId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [school.attendance, gradeId, sectionId],
  )

  const visibleStudents = students.filter((s) => {
    const q = query.trim().toLowerCase()
    if (q && !`${s.name} ${s.rollNo}`.toLowerCase().includes(q)) return false
    if (statusFilter !== 'all' && currentMarks[s.id] !== statusFilter) return false
    return true
  })

  if (!match) return <Navigate to="/classes" replace />
  if (location.pathname !== match.path) return <Navigate to={match.path} replace />
  if (!allowed) return <Navigate to="/classes" replace />

  function setAll(status) {
    setMarks({
      date,
      values: Object.fromEntries(students.map((s) => [s.id, status])),
    })
  }

  function setOne(studentId, status) {
    setMarks({
      date,
      values: { ...currentMarks, [studentId]: status },
    })
  }

  async function save() {
    setSaving(true)
    const result = await saveAttendance({ date, gradeId, sectionId, marks: currentMarks })
    setSaving(false)
    if (result.ok) setMarks(null)
  }

  async function createNewAttendance() {
    if (!newDate) return
    const already = (school.attendance || []).find(
      (a) => a.gradeId === gradeId && a.sectionId === sectionId && a.date === newDate,
    )
    setDate(newDate)
    setMarks(null)
    if (already) {
      setNotice(t('existsOpen', { date: prettyDate(newDate, lang) }))
      return
    }
    setCreating(true)
    const result = await saveAttendance({
      date: newDate,
      gradeId,
      sectionId,
      marks: defaultMarks(students),
    })
    setCreating(false)
    if (result.ok) {
      setMarks(null)
      setNotice(t('createdFor', { date: prettyDate(newDate, lang) }))
    }
  }

  const sheetExists = Boolean(sheet)

  return (
    <>
      <div className="topbar">
        <div>
          <Crumbs
            items={[
              { label: t('crumbsClasses'), to: '/classes' },
              { label: match.gradeName },
              { label: t('sectionOf', { name: match.sectionName }) },
            ]}
          />
          <h2>{t('classTitle', { grade: match.gradeName, section: match.sectionName })}</h2>
          <p>{t('classLead')}</p>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'attendance' ? 'primary' : 'ghost'} onClick={() => setTab('attendance')}>
          {t('tabAttendance')}
        </button>
        <button className={tab === 'students' ? 'primary' : 'ghost'} onClick={() => setTab('students')}>
          {t('tabStudents')}
        </button>
      </div>

      {tab === 'students' ? (
        <>
          <div className="toolbar">
            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchStudent')}
            />
            <span className="muted">{t('recordsView', { count: students.length })}</span>
          </div>
          <div className="table-wrap card">
            {students.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).length === 0 ? (
              <div className="empty">{t('noStudents')}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('colStudent')}</th>
                    <th>{t('colAge')}</th>
                    <th>{t('colParentPhone')}</th>
                    <th>{t('colNic')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
                    .map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="person-cell">
                            <StudentFace student={student} />
                            <div>
                              <strong>{student.name}</strong>
                              <div className="muted">{student.parentName || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{student.age || '—'}</td>
                        <td>{student.parentPhone || '—'}</td>
                        <td>{student.nic || '—'}</td>
                        <td>
                          <button className="ghost" onClick={() => setViewing(student)}>
                            {t('view')}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="attendance-layout">
          <section className="card attend-main">
            <div className="new-attend">
              <div>
                <strong>{t('createAttend')}</strong>
                <p className="muted">{t('createAttendHint')}</p>
              </div>
              <div className="new-attend-row">
                <input
                  type="date"
                  className="search"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <button className="primary" disabled={!newDate || creating} onClick={createNewAttendance}>
                  {creating ? t('creating') : t('createNewAttend')}
                </button>
              </div>
            </div>
            {notice ? <div className="attend-banner exists">{notice}</div> : null}
            <div className={`attend-banner ${sheetExists ? 'exists' : 'fresh'}`}>
              {sheetExists
                ? t('editingFor', { date: prettyDate(date, lang) })
                : date
                  ? t('noneFor', { date: prettyDate(date, lang) })
                  : t('selectDate')}
            </div>
            <div className="toolbar">
              <input type="date" className="search" value={date} onChange={(e) => { setDate(e.target.value); setMarks(null) }} />
              <select className="search" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">{t('allStatuses')}</option>
                {ATTENDANCE_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(statusKey(s.id))}
                  </option>
                ))}
              </select>
              <input
                className="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('filterName')}
              />
            </div>
            <div className="row-actions" style={{ marginBottom: 14 }}>
              <button className="primary" onClick={() => setAll('present')}>
                {t('fillPresent')}
              </button>
              <button className="ghost" onClick={() => setAll('absent')}>
                {t('allAbsent')}
              </button>
              <button className="primary" disabled={!date || saving} onClick={save}>
                {saving ? t('saving') : t('saveAttendance')}
              </button>
            </div>
            <div className="attend-list">
              {visibleStudents.length === 0 ? (
                <div className="empty">{t('noMatch')}</div>
              ) : (
                visibleStudents.map((student) => (
                  <div className="attend-row" key={student.id}>
                    <div className="person-cell">
                      <StudentFace student={student} />
                      <strong>{student.name}</strong>
                    </div>
                    <div className="status-pills">
                      {ATTENDANCE_STATUSES.map((status) => (
                        <button
                          key={status.id}
                          type="button"
                          className={`pill ${currentMarks[student.id] === status.id ? 'on' : ''}`}
                          onClick={() => setOne(student.id, status.id)}
                        >
                          {t(statusKey(status.id))}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          <aside className="card history">
            <strong>{t('previous')}</strong>
            <p className="muted">{t('previousHint')}</p>
            {history.length === 0 ? (
              <div className="empty">{t('noSavedDays')}</div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  className={`history-item ${item.date === date ? 'active' : ''}`}
                  onClick={() => {
                    setDate(item.date)
                    setMarks(null)
                  }}
                >
                  <span>{prettyDate(item.date, lang)}</span>
                  <small>{t('markedBy', { count: Object.keys(item.marks || {}).length, name: item.teacherName })}</small>
                </button>
              ))
            )}
          </aside>
        </div>
      )}

      {viewing ? (
        <div className="modal-back" onClick={() => setViewing(null)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('studentRecord')}</h3>
            <StudentView student={viewing} t={t} />
            <div className="modal-actions">
              <button className="ghost" onClick={() => setViewing(null)}>
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function defaultMarks(students) {
  return Object.fromEntries(students.map((s) => [s.id, 'present']))
}
