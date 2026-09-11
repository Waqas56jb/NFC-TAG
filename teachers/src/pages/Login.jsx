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
      <aside className="login-art" aria-hidden="true">
        <div>
          <div className="chalk" />
          <h2>{t('loginTitle')}</h2>
          <p>{t('loginLead')}</p>
        </div>
        <p>{t('loginFoot')}</p>
      </aside>

      <main className="login-form-wrap">
        <header className="login-mobile-head">
          <div className="chalk sm" aria-hidden="true" />
          <div>
            <p className="login-kicker">{t('brand')}</p>
            <h1>{t('signIn')}</h1>
          </div>
          <LanguageToggle />
        </header>

        <form className="form-card" onSubmit={onSubmit}>
          <div className="login-lang login-lang-desktop">
            <LanguageToggle />
          </div>
          <h3 className="login-card-title">{t('signIn')}</h3>
          <p className="muted">{t('loginHint')}</p>
          <Field label={t('email')}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
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
          <button className="primary login-submit" type="submit">
            {t('enterDesk')}
          </button>
        </form>
      </main>
    </div>
  )
}
