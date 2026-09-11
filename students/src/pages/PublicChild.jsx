import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { displayPhoto } from '../lib/avatar'
import { useI18n } from '../i18n/I18nContext'
import { hub } from '../lib/hubClient'

export function PublicChild() {
  const { code } = useParams()
  const { t } = useI18n()
  const [student, setStudent] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    hub
      .fetchPublicStudent(code)
      .then((result) => {
        if (!live) return
        if (!result.ok) {
          setError(result.error || t('errChildMissing'))
          setStudent(null)
        } else {
          setStudent(result.student)
          setError('')
        }
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [code, t])

  if (loading) {
    return (
      <main className="public-child">
        <div className="public-card">{t('loading')}</div>
      </main>
    )
  }

  if (error || !student) {
    return (
      <main className="public-child">
        <div className="public-card">
          <h1>{t('publicChildMissing')}</h1>
          <p>{error || t('errChildMissing')}</p>
        </div>
      </main>
    )
  }

  const portrait = displayPhoto(student.photo, student.name, student.id || student.name)
  const tel = student.parentPhone || student.emergencyPhone || ''

  return (
    <main className="public-child">
      <article className="public-card">
        <p className="public-brand">أمان · AMAN</p>
        <img className="public-photo" src={portrait} alt={student.name} />
        <h1>{student.name}</h1>
        <p className="public-school">{t('school')}</p>

        <a className="public-btn safety" href="#safety">
          {t('publicSafetyInfo')}
        </a>
        <a className="public-btn login" href="/login">
          {t('publicParentLogin')}
        </a>

        <section id="safety" className="public-safety">
          <h2>{t('publicSafetyInfo')}</h2>
          {student.parentName ? <p><strong>{t('parentGuardian')}</strong> {student.parentName}</p> : null}
          {tel ? (
            <p>
              <strong>{t('parentPhone')}</strong>{' '}
              <a href={`tel:${tel}`}>{tel}</a>
            </p>
          ) : null}
          {student.bloodGroup ? <p><strong>{t('bloodGroup')}</strong> {student.bloodGroup}</p> : null}
          {student.notes ? <p><strong>{t('notes')}</strong> {student.notes}</p> : null}
          {tel ? (
            <a className="public-call" href={`tel:${tel}`}>
              {t('callParent')}
            </a>
          ) : null}
        </section>

        <p className="public-foot">{t('publicFoot')}</p>
      </article>
    </main>
  )
}
