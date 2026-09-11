import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Field } from '../components/Modal'
import { useApp } from '../context/AppContext'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { useI18n } from '../i18n/I18nContext'

export function Login() {
  const { user, login, bootError, boot, ready } = useApp()
  const { t, tx } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const result = await login(email, password)
    if (!result.ok) setError(tx(result.error))
  }

  return (
    <div className="login-page">
      <section className="login-art">
        <div>
          <div className="rings" aria-hidden="true" />
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
              placeholder="madam@nfctag.edu"
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
              <button className="linkish" type="button" onClick={boot} disabled={!ready}>
                {t('tryAgain')}
              </button>
            </div>
          ) : null}
          <button className="primary" type="submit" style={{ width: '100%', marginTop: 18 }}>
            {t('enterDesk')}
          </button>
          <div className="demo-box">
            <strong>{t('demoLogin')}</strong>
            <div>{t('demoMadam')}</div>
            <div>{t('demoSub')}</div>
          </div>
        </form>
      </section>
    </div>
  )
}
