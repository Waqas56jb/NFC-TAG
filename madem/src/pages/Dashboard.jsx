import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { formatActivity } from '../i18n/helpers'

export function Dashboard() {
  const { store, isMadam, user } = useApp()
  const { t, lang } = useI18n()
  const recent = store.activities.slice(0, 5)

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{isMadam ? t('eyebrowMadam') : t('eyebrowOps')}</p>
          <h2>{isMadam ? t('overview') : t('opsDesk')}</h2>
          <p>{isMadam ? t('overviewMadam') : t('overviewSub', { name: user.name })}</p>
        </div>
        <Link className="primary" to="/teachers">
          {isMadam ? t('createTeacher') : t('addTeacherLogin')}
        </Link>
      </div>

      <div className="stats">
        <article className="stat">
          <em>{t('statTeachers')}</em>
          <b>{store.teachers.length}</b>
        </article>
        <article className="stat">
          <em>{t('statGrades')}</em>
          <b>{(store.grades || []).length}</b>
        </article>
        <article className="stat">
          <em>{t('statStudents')}</em>
          <b>{(store.students || []).length}</b>
        </article>
        <article className="stat">
          <em>{isMadam ? t('statSubUsers') : t('yourRole')}</em>
          <b style={{ fontSize: isMadam ? '2rem' : '1.25rem' }}>
            {isMadam ? store.subUsers.length : t('innerOps')}
          </b>
        </article>
      </div>

      {isMadam ? (
        <section className="card activity">
          <div style={{ padding: '16px 16px 0' }}>
            <strong>{t('latestActivity')}</strong>
            <p className="muted">{t('latestActivityHint')}</p>
          </div>
          {recent.length === 0 ? (
            <div className="empty">{t('noActivity')}</div>
          ) : (
            recent.map((item) => (
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
      ) : (
        <div className="note">{t('opsNote')}</div>
      )}
    </>
  )
}
