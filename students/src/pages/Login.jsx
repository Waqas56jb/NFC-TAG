import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStudent } from '../context/StudentContext'
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
  const { student, login, bootError, boot, ready } = useStudent()
  const { t, tx } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (student) return <Navigate to="/profile" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const result = await login(email, password)
    if (!result.ok) setError(tx(result.error))
  }

  return (
    <div className="phone-stage">
      <div className="phone-app login-app">
        <section className="login-hero">
          <div className="login-hero-top">
            <div className="login-mark" aria-hidden="true">
              <span />
            </div>
            <LanguageToggle compact />
          </div>
          <p className="app-kicker">{t('loginFoot')}</p>
          <h2>{t('loginTitle')}</h2>
          <p>{t('loginLead')}</p>
        </section>
        <form className="login-sheet" onSubmit={onSubmit}>
          <h3>{t('signIn')}</h3>
          <p className="muted login-hint">{t('loginHint')}</p>
          <Field label={t('email')}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@student.nfctag.edu"
              autoComplete="username"
              required
            />
          </Field>
          <Field label={t('password')}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('yourPassword')}
              autoComplete="current-password"
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
          <button className="primary app-cta" type="submit">
            {t('enterDesk')}
          </button>
          <div className="demo-box">
            <strong>{t('demoLogin')}</strong>
            <div>{t('demoS1')}</div>
            <div>{t('demoS2')}</div>
          </div>
        </form>
      </div>
    </div>
  )
}
