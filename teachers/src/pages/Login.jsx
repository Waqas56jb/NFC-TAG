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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (teacher) return <Navigate to="/desk" replace />

  async function onSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await login(username, password)
      if (!result.ok) setError(tx(result.error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="phone-stage login-stage">
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
          <div className="login-sheet-body">
            <h3>{t('signIn')}</h3>
            <p className="muted login-hint">{t('loginHint')}</p>
            <fieldset disabled={busy} className="modal-fields">
              <Field label={t('username')}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('usernamePlaceholder')}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
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
            </fieldset>
            {error ? <div className="error">{error}</div> : null}
            {bootError ? (
              <div className="error">
                {tx(bootError)}{' '}
                <button className="ghost" type="button" onClick={boot} disabled={!ready || busy}>
                  {t('tryAgain')}
                </button>
              </div>
            ) : null}
          </div>
          <button className={`primary app-cta${busy ? ' is-loading' : ''}`} type="submit" disabled={busy}>
            {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
            <span>{busy ? t('signingIn') : t('enterDesk')}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
