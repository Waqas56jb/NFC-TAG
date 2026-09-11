import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTeacher } from '../context/TeacherContext'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { useI18n } from '../i18n/I18nContext'

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Login() {
  const { teacher, login, bootError, boot, ready } = useTeacher()
  const { t, tx } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (teacher) return <Navigate to="/desk" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const result = await login(email, password)
    if (!result.ok) setError(tx(result.error))
  }

  return (
    <div className="login-page">
      <section className="login-art">
        <div>
          <div className="chalk" aria-hidden="true" />
          <h2>{t('loginTitle')}</h2>
          <p>{t('loginLead')}</p>
        </div>
        <p>{t('loginFoot')}</p>
      </section>
      <section className="login-form-wrap">
        <form className="form-card" onSubmit={onSubmit}>
          <div className="login-lang">
            <LanguageToggle />
          </div>
          <h3>{t('signIn')}</h3>
          <p className="muted">{t('loginHint')}</p>
          <Field label={t('email')}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmed.raza@nfctag.edu"
              required
            />
          </Field>
          <Field label={t('password')}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('yourPassword')}
              required
            />
          </Field>
          {error ? <div className="error">{error}</div> : null}
          {bootError ? (
            <div className="error">
              {tx(bootError)}{' '}
              <button className="ghost" type="button" onClick={boot} disabled={!ready}>
                {t('tryAgain')}
              </button>
            </div>
          ) : null}
          <button className="primary" type="submit" style={{ width: '100%', marginTop: 18 }}>
            {t('enterDesk')}
          </button>
          <div className="demo-box">
            <strong>{t('demoLogin')}</strong>
            <div>{t('demoT1')}</div>
            <div>{t('demoT2')}</div>
          </div>
        </form>
      </section>
    </div>
  )
}
