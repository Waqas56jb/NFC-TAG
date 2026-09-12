import { useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
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
  const [params] = useSearchParams()
  const asParent = params.get('role') === 'parent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const title = useMemo(() => (asParent ? t('parentLoginTitle') : t('loginTitle')), [asParent, t])
  const lead = useMemo(() => (asParent ? t('parentLoginLead') : t('loginLead')), [asParent, t])
  const signIn = useMemo(() => (asParent ? t('parentSignIn') : t('signIn')), [asParent, t])
  const hint = useMemo(() => (asParent ? t('parentLoginHint') : t('loginHint')), [asParent, t])

  if (student) return <Navigate to="/profile" replace />

  async function onSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await login(email, password)
      if (!result.ok) setError(tx(result.error))
    } finally {
      setBusy(false)
    }
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
          <h2>{title}</h2>
          <p>{lead}</p>
        </section>
        <form className="login-sheet" onSubmit={onSubmit}>
          <h3>{signIn}</h3>
          <p className="muted login-hint">{hint}</p>
          <fieldset disabled={busy} className="modal-fields">
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
          <button className={`primary app-cta${busy ? ' is-loading' : ''}`} type="submit" disabled={busy}>
            {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
            <span>{busy ? t('signingIn') : asParent ? t('enterParentPortal') : t('enterDesk')}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
