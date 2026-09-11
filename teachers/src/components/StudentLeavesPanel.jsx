export function StudentLeavesPanel({ leaves, onReview, t, lang }) {
  if (!leaves?.length) return <div className="card empty">{t('noStudentLeaveRequests')}</div>

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
              <button type="button" className="primary" onClick={() => onReview(item.id, 'approved')}>
                {t('approve')}
              </button>
              <button type="button" className="danger" onClick={() => onReview(item.id, 'rejected')}>
                {t('reject')}
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
                <button type="button" className="ghost" onClick={() => onReview(item.id, 'returned')}>
                  {t('markReturned')}
                </button>
              ) : null}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
