import { useEffect } from 'react'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'

function formatWhen(iso, lang) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function HomeworkFile({ item, t }) {
  if (!item.fileData) return null
  if (item.fileType?.startsWith('image/')) {
    return <img className="hw-media" src={item.fileData} alt={item.fileName || ''} />
  }
  if (item.fileType?.startsWith('video/')) {
    return <video className="hw-media" src={item.fileData} controls />
  }
  return (
    <a className="hw-file" href={item.fileData} download={item.fileName} target="_blank" rel="noreferrer">
      {t('download')} · {item.fileName || t('file')}
    </a>
  )
}

export function Assignments() {
  const { homework, refreshHomework } = useStudent()
  const { t, lang } = useI18n()

  useEffect(() => {
    refreshHomework?.()
  }, [])

  return (
    <section className="app-screen hw-screen">
      <div className="leave-section-head">
        <h3>{t('hwTitle')}</h3>
        <p>{t('hwHint')}</p>
      </div>
      {!homework?.length ? (
        <div className="empty soft">{t('hwEmpty')}</div>
      ) : (
        <div className="hw-list">
          {homework.map((item) => (
            <article key={item.id} className="hw-card">
              <div className="hw-card-top">
                <strong>{item.title}</strong>
                {item.dueAt ? (
                  <span className="hw-due">
                    {t('hwDue')}: {formatWhen(item.dueAt, lang)}
                  </span>
                ) : null}
              </div>
              {item.body ? <p>{item.body}</p> : null}
              <HomeworkFile item={item} t={t} />
              <small>
                {item.teacherName ? t('hwBy', { name: item.teacherName }) : t('roleTeacher')}
                {item.createdAt ? ` · ${formatWhen(item.createdAt, lang)}` : ''}
              </small>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
