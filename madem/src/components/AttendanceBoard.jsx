import { useMemo, useState } from 'react'
import { ChatIconButton } from './ChatIconButton'
import { useI18n } from '../i18n/I18nContext'
import { ATTENDANCE_STATUSES, prettyDate, todayKey } from '../lib/school'

function statusKey(id) {
  return `status_${String(id).replaceAll('-', '_')}`
}

function defaultMarks(students) {
  return Object.fromEntries(students.map((s) => [s.id, 'present']))
}

export function AttendanceBoard({ students, sheets, gradeId, sectionId, onSave, onMessage }) {
  const { t, lang } = useI18n()
  const [date, setDate] = useState(todayKey())
  const [newDate, setNewDate] = useState(todayKey())
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [marks, setMarks] = useState(null)

  const sheet = (sheets || []).find((a) => a.gradeId === gradeId && a.sectionId === sectionId && a.date === date)
  const currentMarks = {
    ...defaultMarks(students),
    ...(marks && marks.date === date ? marks.values : sheet?.marks || {}),
  }
  const history = useMemo(
    () =>
      (sheets || [])
        .filter((a) => a.gradeId === gradeId && a.sectionId === sectionId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [sheets, gradeId, sectionId],
  )
  const visible = students.filter((s) => {
    const q = query.trim().toLowerCase()
    if (q && !`${s.name} ${s.rollNo}`.toLowerCase().includes(q)) return false
    if (statusFilter !== 'all' && currentMarks[s.id] !== statusFilter) return false
    return true
  })

  function setAll(status) {
    setMarks({ date, values: Object.fromEntries(students.map((s) => [s.id, status])) })
  }

  function setOne(studentId, status) {
    setMarks({ date, values: { ...currentMarks, [studentId]: status } })
  }

  async function save() {
    setSaving(true)
    const result = await onSave({ date, gradeId, sectionId, marks: currentMarks })
    setSaving(false)
    if (result?.ok) setMarks(null)
  }

  async function createNew() {
    if (!newDate) return
    const already = (sheets || []).find((a) => a.gradeId === gradeId && a.sectionId === sectionId && a.date === newDate)
    setDate(newDate)
    setMarks(null)
    if (already) {
      setNotice(t('existsOpen', { date: prettyDate(newDate, lang) }))
      return
    }
    setCreating(true)
    const result = await onSave({ date: newDate, gradeId, sectionId, marks: defaultMarks(students) })
    setCreating(false)
    if (result?.ok) {
      setMarks(null)
      setNotice(t('createdFor', { date: prettyDate(newDate, lang) }))
    }
  }

  return (
    <div className="attendance-layout">
      <section className="card attend-main">
        <div className="new-attend">
          <div>
            <strong>{t('createAttend')}</strong>
            <p className="muted">{t('createAttendHint')}</p>
          </div>
          <div className="new-attend-row">
            <input type="date" className="search" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <button className="primary" disabled={!newDate || creating} onClick={createNew}>
              {creating ? t('creating') : t('createNewAttend')}
            </button>
          </div>
        </div>
        {notice ? <div className="attend-banner exists">{notice}</div> : null}
        <div className={`attend-banner ${sheet ? 'exists' : 'fresh'}`}>
          {sheet ? t('editingFor', { date: prettyDate(date, lang) }) : date ? t('noneFor', { date: prettyDate(date, lang) }) : t('selectDate')}
        </div>
        <div className="toolbar">
          <input type="date" className="search" value={date} onChange={(e) => { setDate(e.target.value); setMarks(null) }} />
          <select className="search" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t('allStatuses')}</option>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{t(statusKey(s.id))}</option>
            ))}
          </select>
          <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('filterName')} />
        </div>
        <div className="row-actions" style={{ marginBottom: 14 }}>
          <button className="primary" onClick={() => setAll('present')}>{t('fillPresent')}</button>
          <button className="ghost" onClick={() => setAll('absent')}>{t('allAbsent')}</button>
          <button className={`primary${saving ? ' is-loading' : ''}`} disabled={!date || saving} onClick={save}>
            {saving ? <span className="btn-spinner" aria-hidden="true" /> : null}
            <span>{saving ? t('saving') : t('saveAttendance')}</span>
          </button>
        </div>
        <div className="attend-list">
          {visible.length === 0 ? (
            <div className="empty">{t('noMatch')}</div>
          ) : (
            visible.map((student) => (
              <div className="attend-row" key={student.id}>
                <div className="person-cell">
                  {student.photo ? <img className="avatar" src={student.photo} alt="" /> : <div className="avatar placeholder">{student.name.slice(0, 1)}</div>}
                  <strong>{student.name}</strong>
                  {onMessage ? <ChatIconButton label={t('message')} onClick={() => onMessage(student)} /> : null}
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
              onClick={() => { setDate(item.date); setMarks(null) }}
            >
              <span>{prettyDate(item.date, lang)}</span>
              <small>{t('markedBy', { count: Object.keys(item.marks || {}).length, name: item.teacherName })}</small>
            </button>
          ))
        )}
      </aside>
    </div>
  )
}
