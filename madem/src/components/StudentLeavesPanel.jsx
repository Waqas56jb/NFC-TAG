import { useState } from 'react'

function formatWhen(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function StudentLeavesPanel({ leaves, onReturn, onReview, t, lang, readOnly = false }) {
  const [busyId, setBusyId] = useState('')

  if (!leaves?.length) return <div className="card empty">{t('noStudentLeaveLog')}</div>

  async function markReturn(id) {
    if (busyId || readOnly) return
    setBusyId(id)
    try {
      await onReturn?.(id)
    } finally {
      setBusyId('')
    }
  }

  async function review(id, status) {
    if (busyId || readOnly) return
    setBusyId(`${id}:${status}`)
    try {
      await onReview?.(id, status)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="student-leave-board">
      {leaves.map((item) => {
        const isSchoolRequest = item.leaveType === 'leave_school' && item.status === 'pending'
        const isOut =
          !isSchoolRequest &&
          item.status !== 'returned' &&
          item.status !== 'rejected' &&
          (item.status === 'approved' || item.status === 'out' || item.status === 'pending' || item.leftAt)
        return (
          <article key={item.id} className={`student-leave-card status-${item.status}`}>
            <div className="student-leave-top">
              <div className="person-cell">
                {item.studentPhoto ? (
                  <img className="avatar" src={item.studentPhoto} alt="" />
                ) : (
                  <div className="avatar placeholder">{(item.studentName || '?').slice(0, 1)}</div>
                )}
                <div>
                  <strong>{item.studentName}</strong>
                  <div className="muted">
                    {[item.gradeName, item.sectionName].filter(Boolean).join(' · ') || t('classCard')}
                  </div>
                </div>
              </div>
              <span className={`badge ${isSchoolRequest ? '' : isOut ? 'off' : item.status === 'rejected' ? 'off' : 'on'}`}>
                {isSchoolRequest
                  ? t('sleave_pending')
                  : isOut
                    ? t('sleave_out')
                    : t(`sleave_${item.status === 'approved' ? 'returned' : item.status}`)}
              </span>
            </div>

            <div className="student-leave-meta">
              <strong>{t(`leaveType_${item.leaveType}`)}</strong>
            </div>
            {item.leaveType === 'leave_school' && item.status === 'pending' ? (
              <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.82rem' }}>
                {t('schoolLeaveNeedsDecision')}
              </p>
            ) : (
              <div className="student-leave-times">
                <div>
                  <span className="muted">{t('leftAt')}</span>
                  <b>{formatWhen(item.leftAt || item.createdAt, lang)}</b>
                </div>
                <div>
                  <span className="muted">{t('returnedAt')}</span>
                  <b>{formatWhen(item.returnedAt, lang)}</b>
                </div>
              </div>
            )}
            {item.note ? <p className="student-leave-note">{item.note}</p> : null}

            {isSchoolRequest && !readOnly ? (
              <div className="row-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className={`primary${busyId === `${item.id}:approved` ? ' is-loading' : ''}`}
                  disabled={Boolean(busyId)}
                  onClick={() => review(item.id, 'approved')}
                >
                  {busyId === `${item.id}:approved` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                  <span>{t('approve')}</span>
                </button>
                <button
                  type="button"
                  className={`danger${busyId === `${item.id}:rejected` ? ' is-loading' : ''}`}
                  disabled={Boolean(busyId)}
                  onClick={() => review(item.id, 'rejected')}
                >
                  {busyId === `${item.id}:rejected` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                  <span>{t('reject')}</span>
                </button>
              </div>
            ) : (
              <div className="student-leave-foot">
                <span className="muted">
                  {item.reviewedByName ? t('leaveRecordedBy', { name: item.reviewedByName }) : '—'}
                </span>
                {isOut && !readOnly ? (
                  <button
                    type="button"
                    className={`ghost${busyId === item.id ? ' is-loading' : ''}`}
                    disabled={Boolean(busyId)}
                    onClick={() => markReturn(item.id)}
                  >
                    {busyId === item.id ? <span className="btn-spinner" aria-hidden="true" /> : null}
                    <span>{busyId === item.id ? t('working') : t('markReturned')}</span>
                  </button>
                ) : null}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
