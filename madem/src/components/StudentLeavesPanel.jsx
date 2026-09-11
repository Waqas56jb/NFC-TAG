import { useState } from 'react'

export function StudentLeavesPanel({ leaves, onReview, t, lang }) {
  const [busyKey, setBusyKey] = useState('')

  if (!leaves?.length) return <div className="card empty">{t('noStudentLeaveRequests')}</div>

  async function review(id, status) {
    if (busyKey) return
    setBusyKey(`${id}:${status}`)
    try {
      await onReview?.(id, status)
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div className="student-leave-board">
      {leaves.map((item) => (
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
            <span className={`badge ${item.status === 'approved' || item.status === 'returned' ? 'on' : item.status === 'rejected' ? 'off' : ''}`}>
              {t(`sleave_${item.status}`)}
            </span>
          </div>

          <div className="student-leave-meta">
            <strong>{t(`leaveType_${item.leaveType}`)}</strong>
            <span>
              {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          {item.note ? <p className="student-leave-note">{item.note}</p> : null}

          {item.status === 'pending' ? (
            <div className="row-actions">
              <button
                type="button"
                className={`primary${busyKey === `${item.id}:approved` ? ' is-loading' : ''}`}
                disabled={Boolean(busyKey)}
                onClick={() => review(item.id, 'approved')}
              >
                {busyKey === `${item.id}:approved` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                <span>{busyKey === `${item.id}:approved` ? t('working') : t('approve')}</span>
              </button>
              <button
                type="button"
                className={`danger${busyKey === `${item.id}:rejected` ? ' is-loading' : ''}`}
                disabled={Boolean(busyKey)}
                onClick={() => review(item.id, 'rejected')}
              >
                {busyKey === `${item.id}:rejected` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                <span>{busyKey === `${item.id}:rejected` ? t('working') : t('reject')}</span>
              </button>
            </div>
          ) : (
            <div className="student-leave-foot">
              <span className="muted">
                {item.reviewedByName
                  ? t('leaveReviewedBy', { name: item.reviewedByName })
                  : '—'}
              </span>
              {item.status === 'approved' ? (
                <button
                  type="button"
                  className={`ghost${busyKey === `${item.id}:returned` ? ' is-loading' : ''}`}
                  disabled={Boolean(busyKey)}
                  onClick={() => review(item.id, 'returned')}
                >
                  {busyKey === `${item.id}:returned` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                  <span>{busyKey === `${item.id}:returned` ? t('working') : t('markReturned')}</span>
                </button>
              ) : null}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
