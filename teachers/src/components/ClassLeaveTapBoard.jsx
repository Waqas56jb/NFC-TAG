import { useMemo, useState } from 'react'
import { MOVEMENT_TYPES, OUT_STATUSES } from '../lib/studentLeave'
import { displayPhoto } from '../lib/avatar'

function formatTime(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isOpenOut(leave) {
  if (!leave) return false
  if (leave.returnedAt || leave.status === 'returned' || leave.status === 'rejected') return false
  if (leave.leaveType === 'leave_school' && leave.status === 'pending') return false
  return OUT_STATUSES.includes(leave.status) || Boolean(leave.leftAt)
}

/**
 * One-tap leave / return for class students (like teacher check-in / check-out).
 */
export function ClassLeaveTapBoard({
  students = [],
  classCards = [],
  leaves = [],
  onToggle,
  t,
  lang,
}) {
  const [leaveType, setLeaveType] = useState('restroom')
  const [busyId, setBusyId] = useState('')
  const [query, setQuery] = useState('')

  const outByStudent = useMemo(() => {
    const map = new Map()
    for (const leave of leaves || []) {
      if (!isOpenOut(leave)) continue
      if (!map.has(leave.studentId)) map.set(leave.studentId, leave)
    }
    return map
  }, [leaves])

  const classLabel = useMemo(() => {
    const map = new Map()
    for (const c of classCards || []) {
      map.set(`${c.gradeId}:${c.sectionId}`, `${c.gradeName} · ${c.sectionName}`)
    }
    return map
  }, [classCards])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...(students || [])]
      .filter((s) => {
        if (!q) return true
        return `${s.name} ${s.rollNo || ''} ${s.nic || ''}`.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const aOut = outByStudent.has(a.id) ? 0 : 1
        const bOut = outByStudent.has(b.id) ? 0 : 1
        if (aOut !== bOut) return aOut - bOut
        return String(a.name).localeCompare(String(b.name))
      })
  }, [students, query, outByStudent])

  async function tap(student) {
    if (!student?.id || busyId) return
    setBusyId(student.id)
    try {
      await onToggle?.(student.id, leaveType)
    } finally {
      setBusyId('')
    }
  }

  if (!students?.length) {
    return <div className="empty soft">{t('noStudentsClass')}</div>
  }

  return (
    <div className="class-leave-tap">
      <label className="field">
        <span>{t('nfcLeaveType')}</span>
        <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
          {MOVEMENT_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {t(`leaveType_${item.id}`)}
            </option>
          ))}
        </select>
      </label>

      <input
        className="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchStudent')}
        aria-label={t('searchStudent')}
      />

      <p className="muted class-leave-tap-hint">{t('classLeaveTapHint')}</p>

      <div className="class-leave-tap-list">
        {list.map((student) => {
          const open = outByStudent.get(student.id)
          const out = Boolean(open)
          const busy = busyId === student.id
          const cls = classLabel.get(`${student.gradeId}:${student.sectionId}`) || ''
          return (
            <article key={student.id} className={`class-leave-row${out ? ' is-out' : ''}`}>
              <div className="class-leave-who">
                <img
                  className="avatar"
                  src={displayPhoto(student.photo, student.name, student.id || student.name)}
                  alt=""
                  loading="lazy"
                />
                <div className="class-leave-who-text">
                  <strong>{student.name}</strong>
                  <span className="muted">
                    {cls}
                    {student.rollNo ? ` · ${t('rollNo')} ${student.rollNo}` : ''}
                  </span>
                  {out ? (
                    <span className="class-leave-time">
                      {t('leftAt')}: {formatTime(open.leftAt || open.createdAt, lang)}
                      {open.leaveType ? ` · ${t(`leaveType_${open.leaveType}`)}` : ''}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className={`${out ? 'ghost restroom-btn is-out' : 'primary'}${busy ? ' is-loading' : ''}`}
                disabled={busy}
                onClick={() => tap(student)}
              >
                {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
                <span>
                  {busy
                    ? t('working')
                    : out
                      ? t('studentReturnBtn')
                      : t('studentLeaveBtn')}
                </span>
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
