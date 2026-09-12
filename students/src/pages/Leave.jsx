import { useEffect, useMemo, useState } from 'react'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'
import { displayPhoto } from '../lib/avatar'
import { MOVEMENT_TYPES } from '../lib/studentLeave'
import { studentTagCode } from '../lib/nfcTag'
import { classLabel } from '../lib/school'

function formatWhen(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function TypeIcon({ name }) {
  const props = {
    className: 'leave-type-ico',
    viewBox: '0 0 48 48',
    fill: 'none',
    'aria-hidden': true,
  }
  if (name === 'restroom') {
    return (
      <svg {...props}>
        <circle cx="18" cy="14" r="5" fill="currentColor" opacity="0.9" />
        <path d="M11 40v-10c0-3.3 2.7-6 6-6h2c3.3 0 6 2.7 6 6v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="14" r="5" fill="currentColor" opacity="0.55" />
        <path d="M26 40V28c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      </svg>
    )
  }
  if (name === 'admin') {
    return (
      <svg {...props}>
        <path d="M8 40V18l16-10 16 10v22" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <rect x="18" y="26" width="12" height="14" rx="1.5" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }
  if (name === 'clinic') {
    return (
      <svg {...props}>
        <rect x="10" y="10" width="28" height="28" rx="8" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'library') {
    return (
      <svg {...props}>
        <path d="M12 36V14c0-2 1.5-3.5 3.5-3.5H22v25.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M36 36V14c0-2-1.5-3.5-3.5-3.5H26v25.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M10 36h28" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'exit') {
    return (
      <svg {...props}>
        <path d="M10 12h14v24H10" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M20 24h16M30 18l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <circle cx="14" cy="24" r="3.5" fill="currentColor" />
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
      <circle cx="34" cy="24" r="3.5" fill="currentColor" />
    </svg>
  )
}

export function Leave() {
  const { student, grades, leaves, requestLeave, refreshLeaves } = useStudent()
  const { t, lang, tx } = useI18n()
  const [focusType, setFocusType] = useState('restroom')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    refreshLeaves?.()
  }, [student?.id])

  const klass = useMemo(
    () => (student ? classLabel(grades, student.gradeId, student.sectionId) : ''),
    [grades, student],
  )
  const classMeta = useMemo(() => {
    const cards = grades.flatMap((grade) =>
      (grade.sections || []).map((section) => ({
        gradeId: grade.id,
        sectionId: section.id,
        gradeName: grade.name,
        sectionName: section.name,
      })),
    )
    return cards.find((c) => c.gradeId === student?.gradeId && c.sectionId === student?.sectionId) || {}
  }, [grades, student])

  const movementLeaves = useMemo(
    () => (leaves || []).filter((item) => item.leaveType && item.leaveType !== 'leave_school'),
    [leaves],
  )
  const schoolRequests = useMemo(
    () => (leaves || []).filter((item) => item.leaveType === 'leave_school'),
    [leaves],
  )
  const focused = useMemo(
    () => movementLeaves.filter((item) => item.leaveType === focusType),
    [movementLeaves, focusType],
  )
  const counts = useMemo(() => {
    const next = {}
    for (const type of MOVEMENT_TYPES) next[type.id] = 0
    for (const item of movementLeaves) {
      if (next[item.leaveType] != null) next[item.leaveType] += 1
    }
    return next
  }, [movementLeaves])

  if (!student) return null

  const portrait = displayPhoto(student.photo, student.name, student.id || student.email)
  const tag = studentTagCode(student)

  async function submitSchoolLeave(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await requestLeave({
        leaveType: 'leave_school',
        note,
        gradeName: classMeta.gradeName,
        sectionName: classMeta.sectionName,
      })
      if (!result?.ok) {
        setError(tx(result?.error || t('errRequest')))
        return
      }
      setNote('')
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="app-screen leave-screen">
      <article className="leave-hero leave-hero-pass">
        <div className="leave-hero-bg" aria-hidden="true" />
        <div className="leave-pass-mark">
          <span className="leave-pass-aman">أمان</span>
          <code>{tag || '—'}</code>
        </div>
        <div className="leave-hero-text">
          <p className="leave-kicker">{t('leavePassBrand')}</p>
          <h2>{student.name}</h2>
          <p>{klass || t('studentRole')}</p>
        </div>
        <img className="leave-avatar" src={portrait} alt="" />
      </article>

      <section className="leave-history">
        <div className="leave-section-head">
          <h3>{t('movementLogTitle')}</h3>
          <p>{t('movementLogHint')}</p>
        </div>

        <div className="leave-type-grid">
          {MOVEMENT_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`leave-type-card${focusType === item.id ? ' on' : ''}`}
              onClick={() => setFocusType(item.id)}
            >
              <span className={`leave-type-badge ${item.icon}`}>
                <TypeIcon name={item.icon} />
              </span>
              <strong>{t(`leaveType_${item.id}`)}</strong>
              <em className="leave-type-count">
                {t('movementCount', { count: counts[item.id] || 0 })}
              </em>
            </button>
          ))}
        </div>

        <div className="leave-focus-head">
          <h4>{t(`leaveType_${focusType}`)}</h4>
          <span className="muted">{t('movementCount', { count: focused.length })}</span>
        </div>
        {focused.length === 0 ? (
          <div className="empty soft">{t('movementEmpty')}</div>
        ) : (
          <div className="leave-list">
            {focused.map((item) => {
              const isOut =
                item.status !== 'returned' &&
                item.status !== 'rejected' &&
                (item.status === 'approved' || item.status === 'out' || item.status === 'pending' || item.leftAt)
              return (
                <article key={item.id} className="leave-item">
                  <div>
                    <strong>
                      {t('leftAt')}: {formatWhen(item.leftAt || item.createdAt, lang)}
                    </strong>
                    <p>
                      {t('returnedAt')}: {formatWhen(item.returnedAt, lang)}
                    </p>
                    {item.reviewedByName ? (
                      <small>{t('leaveRecordedBy', { name: item.reviewedByName })}</small>
                    ) : null}
                  </div>
                  <span className={`leave-status ${isOut ? 'pending' : 'returned'}`}>
                    {isOut ? t('sleave_out') : t('sleave_returned')}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="leave-form">
        <div className="leave-section-head">
          <h3>{t('schoolLeaveTitle')}</h3>
          <p>{t('schoolLeaveHint')}</p>
        </div>

        {done ? (
          <div className="leave-success">
            <div className="leave-success-check" aria-hidden="true" />
            <h2>{t('schoolLeaveSentTitle')}</h2>
            <p className="muted">{t('schoolLeaveSentHint')}</p>
            <button type="button" className="leave-ok primary" onClick={() => setDone(false)}>
              {t('leaveOk')}
            </button>
          </div>
        ) : (
          <form onSubmit={submitSchoolLeave}>
            <div className="leave-school-card">
              <span className="leave-type-badge exit">
                <TypeIcon name="exit" />
              </span>
              <div>
                <strong>{t('leaveType_leave_school')}</strong>
                <p className="muted">{t('schoolLeaveOnlyRequest')}</p>
              </div>
            </div>
            <label className="leave-note">
              {t('leaveNote')}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t('leaveNoteHint')}
                disabled={busy}
              />
            </label>
            {error ? <div className="error">{error}</div> : null}
            <button className={`primary leave-submit${busy ? ' is-loading' : ''}`} type="submit" disabled={busy}>
              {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
              <span>{busy ? t('sending') : t('sendSchoolLeave')}</span>
            </button>
          </form>
        )}

        {schoolRequests.length > 0 ? (
          <div className="leave-list" style={{ marginTop: 14 }}>
            <h4 className="leave-focus-head" style={{ marginBottom: 8 }}>
              {t('schoolLeaveHistory')}
            </h4>
            {schoolRequests.map((item) => (
              <article key={item.id} className="leave-item">
                <div>
                  <strong>{t('leaveType_leave_school')}</strong>
                  <p>{formatWhen(item.createdAt, lang)}</p>
                  {item.note ? <p>{item.note}</p> : null}
                </div>
                <span
                  className={`leave-status ${
                    item.status === 'approved' || item.status === 'returned'
                      ? 'approved'
                      : item.status === 'rejected'
                        ? 'rejected'
                        : 'pending'
                  }`}
                >
                  {t(`sleave_${item.status === 'approved' && !item.returnedAt ? 'approved' : item.status}`)}
                </span>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}
