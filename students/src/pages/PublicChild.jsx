import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { displayPhoto } from '../lib/avatar'
import { useI18n } from '../i18n/I18nContext'
import { hub } from '../lib/hubClient'

export function PublicChild() {
  const { code } = useParams()
  const { t } = useI18n()
  const [student, setStudent] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSafety, setShowSafety] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    const clean = String(code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
    hub
      .fetchPublicStudent(clean)
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
  const parentTel = student.parentPhone || ''
  const emergencyTel = student.emergencyPhone || ''

  return (
    <main className="public-child">
      <article className="public-card">
        <p className="public-kicker">{t('publicChildTitle')}</p>
        <img className="public-photo" src={portrait} alt={student.name} />
        <h1>{student.name}</h1>
        <p className="public-school">{t('school')}</p>

        <button
          className="public-btn safety"
          type="button"
          onClick={() => setShowSafety((v) => !v)}
        >
          <span className="public-btn-ico shield" aria-hidden="true" />
          {t('publicSafetyInfo')}
        </button>
        <Link className="public-btn login" to="/login?role=parent">
          <span className="public-btn-ico users" aria-hidden="true" />
          {t('publicParentLogin')}
        </Link>

        {showSafety ? (
          <section id="safety" className="public-safety">
            <h2>{t('publicSafetyInfo')}</h2>
            <p className="public-safety-lead">{t('publicSafetyLead')}</p>
            <ul className="public-safety-list">
              <li>
                <span>{t('childName')}</span>
                <strong>{student.name}</strong>
              </li>
              <li>
                <span>{t('parentGuardian')}</span>
                <strong>{student.parentName || '—'}</strong>
              </li>
              <li>
                <span>{t('parentPhone')}</span>
                <strong>
                  {parentTel ? <a href={`tel:${parentTel}`}>{parentTel}</a> : '—'}
                </strong>
              </li>
              <li>
                <span>{t('emergencyPhone')}</span>
                <strong>
                  {emergencyTel ? <a href={`tel:${emergencyTel}`}>{emergencyTel}</a> : '—'}
                </strong>
              </li>
              <li>
                <span>{t('bloodGroup')}</span>
                <strong>{student.bloodGroup || '—'}</strong>
              </li>
              <li>
                <span>{t('allergies')}</span>
                <strong>{student.allergies || t('noAllergies')}</strong>
              </li>
              <li>
                <span>{t('medicalNotes')}</span>
                <strong>{student.notes || '—'}</strong>
              </li>
            </ul>
            {parentTel || emergencyTel ? (
              <div className="public-call-row">
                {parentTel ? (
                  <a className="public-call" href={`tel:${parentTel}`}>
                    {t('callParent')}
                  </a>
                ) : null}
                {emergencyTel && emergencyTel !== parentTel ? (
                  <a className="public-call emergency" href={`tel:${emergencyTel}`}>
                    {t('callEmergency')}
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <p className="public-private-hint">{t('publicPrivateHint')}</p>
        <p className="public-foot">
          <span className="public-heart" aria-hidden="true">
            ♥
          </span>{' '}
          {t('publicFoot')}
        </p>
      </article>
    </main>
  )
}
