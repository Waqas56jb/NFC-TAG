import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { formatActivity } from '../i18n/helpers'

export function Activity() {
  const { isMadam, store } = useApp()
  const { t, lang } = useI18n()
  const [filter, setFilter] = useState('all')

  const rows = useMemo(() => {
    return store.activities.filter((item) => {
      if (filter === 'sub') return item.actorRole === 'sub'
      if (filter === 'teachers') return item.targetType === 'teacher'
      if (filter === 'classes') return item.targetType === 'grade' || item.targetType === 'section' || item.targetType === 'class'
      if (filter === 'students') return item.targetType === 'student'
      if (filter === 'assign') return item.action === 'assigned' || item.action === 'unassigned' || item.action === 'hid' || item.action === 'showed'
      return true
    })
  }, [store.activities, filter])

  if (!isMadam) return <Navigate to="/" replace />

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{t('audit')}</p>
          <h2>{t('activityTitle')}</h2>
          <p>{t('activityLead')}</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="search" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">{t('filterAll')}</option>
          <option value="sub">{t('filterSub')}</option>
          <option value="teachers">{t('filterTeachers')}</option>
          <option value="classes">{t('filterClasses')}</option>
          <option value="students">{t('filterStudents')}</option>
          <option value="assign">{t('filterAssign')}</option>
        </select>
      </div>

      <section className="card activity">
        {rows.length === 0 ? (
          <div className="empty">{t('nothingFilter')}</div>
        ) : (
          rows.map((item) => (
            <div className="activity-item" key={item.id}>
              <span className={`badge ${item.actorRole === 'madam' ? 'role' : 'on'}`}>
                {item.actorRole === 'madam' ? t('roleMadamBadge') : t('roleSubBadge')}
              </span>
              <div>
                <strong>{item.actorName}</strong> {formatActivity(item, t).line}
                <div className="muted">{formatActivity(item, t).detail}</div>
              </div>
              <small>{new Date(item.at).toLocaleString(lang === 'ar' ? 'ar' : 'en')}</small>
            </div>
          ))
        )}
      </section>
    </>
  )
}
