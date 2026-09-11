import { useEffect, useMemo, useState } from 'react'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'
import { displayPhoto } from '../lib/avatar'
import { LEAVE_TYPES } from '../lib/studentLeave'
import { classLabel } from '../lib/school'

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
  const [type, setType] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

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

  if (!student) return null

  const portrait = displayPhoto(student.photo, student.name, student.id || student.email)

  async function submit(e) {
    e.preventDefault()
    if (!type) {
      setError(t('errLeaveType'))
      return
    }
    setBusy(true)
    setError('')
    const result = await requestLeave({
      leaveType: type,
      note,
      gradeName: classMeta.gradeName || '',
      sectionName: classMeta.sectionName || '',
    })
    setBusy(false)
    if (!result?.ok) {
      setError(tx(result?.error || t('errRequest')))
      return
    }
    setDone({ type, at: new Date().toISOString() })
    setType('')
    setNote('')
  }

  if (done) {
    return (
      <section className="app-screen leave-screen">
        <article className="leave-success">
          <div className="leave-success-check" aria-hidden="true">
            ✓
          </div>
          <p className="leave-kicker">{t('leaveSentKicker')}</p>
          <h2>{t('leaveSentTitle')}</h2>
          <p className="leave-success-meta">
            {t(`leaveType_${done.type}`)}
            <span>·</span>
            {new Date(done.at).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
              hour: 'numeric',
              minute: '2-digit',
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <p className="muted">{t('leaveSentHint')}</p>
          <button type="button" className="primary leave-ok" onClick={() => setDone(null)}>
            {t('leaveOk')}
          </button>
        </article>
      </section>
    )
  }

  return (
    <section className="app-screen leave-screen">
      <article className="leave-hero">
        <div className="leave-hero-bg" aria-hidden="true" />
        <img className="leave-avatar" src={portrait} alt="" loading="lazy" referrerPolicy="no-referrer" />
        <div className="leave-hero-text">
          <p className="leave-kicker">{t('leavePassBrand')}</p>
          <h2>{student.name}</h2>
          <p>{klass || t('studentRole')}</p>
        </div>
      </article>

      <form className="leave-form" onSubmit={submit}>
        <div className="leave-section-head">
          <h3>{t('leaveChooseType')}</h3>
          <p>{t('leaveChooseHint')}</p>
        </div>

        <div className="leave-type-grid">
          {LEAVE_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`leave-type-card ${type === item.id ? 'on' : ''}`}
              onClick={() => setType(item.id)}
            >
              <span className={`leave-type-badge ${item.icon}`}>
                <TypeIcon name={item.icon} />
              </span>
              <strong>{t(`leaveType_${item.id}`)}</strong>
            </button>
          ))}
        </div>

        <label className="leave-note">
          <span>{t('leaveNote')}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('leaveNoteHint')}
            rows={3}
          />
        </label>

        {error ? <div className="error">{error}</div> : null}

        <button className="primary leave-submit" type="submit" disabled={busy || !type}>
          {busy ? t('sending') : t('sendLeaveRequest')}
        </button>
      </form>

      <section className="leave-history">
        <div className="leave-section-head">
          <h3>{t('leaveHistory')}</h3>
          <p>{t('leaveHistoryHint')}</p>
        </div>
        {(leaves || []).length === 0 ? (
          <div className="empty soft">{t('noStudentLeaves')}</div>
        ) : (
          <ul className="leave-list">
            {leaves.map((item) => (
              <li key={item.id} className={`leave-item status-${item.status}`}>
                <div>
                  <strong>{t(`leaveType_${item.leaveType}`)}</strong>
                  <p>
                    {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {item.note ? <small>{item.note}</small> : null}
                  {item.reviewedByName ? (
                    <small className="leave-reviewer">
                      {t('leaveReviewedBy', { name: item.reviewedByName })}
                    </small>
                  ) : null}
                </div>
                <span className={`leave-status ${item.status}`}>{t(`sleave_${item.status}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
