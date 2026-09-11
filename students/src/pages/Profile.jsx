import { useState } from 'react'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'
import { genderLabel } from '../i18n/helpers'
import { displayPhoto } from '../lib/avatar'
import { downloadNfcTag } from '../lib/nfcTag'
import { classLabel, prettyDate } from '../lib/school'

function Row({ label, value, href }) {
  if (!value) {
    return (
      <div className="pf-row">
        <span>{label}</span>
        <strong className="empty">—</strong>
      </div>
    )
  }
  return (
    <div className="pf-row">
      <span>{label}</span>
      {href ? (
        <a className="pf-link" href={href}>
          {value}
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  )
}

function Section({ title, children, icon }) {
  return (
    <section className="pf-sheet">
      <div className="pf-sheet-head">
        <span className={`pf-ico ${icon}`} aria-hidden="true" />
        <h3>{title}</h3>
      </div>
      <div className="pf-sheet-body">{children}</div>
    </section>
  )
}

export function Profile() {
  const { student, grades, logout } = useStudent()
  const { t, lang } = useI18n()
  const [tagBusy, setTagBusy] = useState(false)
  const [tagMsg, setTagMsg] = useState('')
  if (!student) return null

  const klass = classLabel(grades, student.gradeId, student.sectionId)
  const dob = student.dob ? prettyDate(student.dob, lang) || student.dob : ''
  const portrait = displayPhoto(student.photo, student.name, student.id || student.email)
  const initial = (student.name || '?').trim().charAt(0).toUpperCase()

  async function handleDownloadTag() {
    setTagBusy(true)
    setTagMsg('')
    try {
      await downloadNfcTag(student, { schoolName: t('school') })
      setTagMsg(t('toastNfcDownloaded'))
    } catch (err) {
      setTagMsg(err.message || t('errNfcDownload'))
    } finally {
      setTagBusy(false)
    }
  }

  return (
    <section className="app-screen pf-screen">
      <article className="pf-hero">
        <div className="pf-hero-bg" aria-hidden="true" />
        <div className="pf-avatar-wrap">
          <img className="pf-avatar" src={portrait} alt={student.name} loading="lazy" referrerPolicy="no-referrer" />
          <span className="pf-avatar-badge">{initial}</span>
        </div>
        <h2>{student.name}</h2>
        <p className="pf-class">{klass || t('studentRole')}</p>
        <p className="pf-note">{t('profileReadOnly')}</p>
        <button className="pf-nfc-btn" type="button" disabled={tagBusy} onClick={handleDownloadTag}>
          {tagBusy ? t('downloadingNfc') : t('downloadNfcTag')}
        </button>
        {tagMsg ? <p className="pf-nfc-msg">{tagMsg}</p> : null}
      </article>

      <div className="pf-quick">
        <div className="pf-quick-card">
          <span>{t('rollNo')}</span>
          <b>{student.rollNo || '—'}</b>
        </div>
        <div className="pf-quick-card">
          <span>{t('bloodGroup')}</span>
          <b>{student.bloodGroup || '—'}</b>
        </div>
        <div className="pf-quick-card">
          <span>{t('age')}</span>
          <b>{student.age || '—'}</b>
        </div>
      </div>

      <Section title={t('profileSchool')} icon="school">
        <Row label={t('classCard')} value={klass} />
        <Row label={t('rollNo')} value={student.rollNo} />
        <Row label={t('email')} value={student.email} href={student.email ? `mailto:${student.email}` : undefined} />
      </Section>

      <Section title={t('profilePersonal')} icon="person">
        <Row label={t('gender')} value={genderLabel(student.gender, t)} />
        <Row label={t('dob')} value={dob} />
        <Row label={t('nic')} value={student.nic} />
        <Row label={t('bloodGroup')} value={student.bloodGroup} />
      </Section>

      <Section title={t('profileFamily')} icon="family">
        <Row label={t('parentGuardian')} value={student.parentName} />
        <Row
          label={t('parentPhone')}
          value={student.parentPhone}
          href={student.parentPhone ? `tel:${student.parentPhone}` : undefined}
        />
        <Row
          label={t('parentEmail')}
          value={student.parentEmail}
          href={student.parentEmail ? `mailto:${student.parentEmail}` : undefined}
        />
        <Row
          label={t('emergencyPhone')}
          value={student.emergencyPhone}
          href={student.emergencyPhone ? `tel:${student.emergencyPhone}` : undefined}
        />
        <Row label={t('address')} value={student.address} />
        <Row label={t('notes')} value={student.notes} />
      </Section>

      <section className="pf-sheet pf-account">
        <div className="pf-sheet-head">
          <span className="pf-ico settings" aria-hidden="true" />
          <h3>{t('settings')}</h3>
        </div>
        <button className="pf-signout" type="button" onClick={logout}>
          {t('signOut')}
        </button>
      </section>
    </section>
  )
}
