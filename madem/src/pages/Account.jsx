import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Field } from '../components/Modal'
import { Secret } from '../components/Secret'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'

export function Account() {
  const { isMadam, store, updateMadamAccount } = useApp()
  const { t, tx } = useI18n()
  const [form, setForm] = useState({
    name: store.madam?.name || '',
    email: store.madam?.email || '',
    currentPassword: '',
    newPassword: '',
  })
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  if (!isMadam) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setDone('')
    const result = await updateMadamAccount(form)
    if (!result.ok) {
      setError(tx(result.error))
      return
    }
    setError('')
    setDone(t('accountSaved'))
    setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }))
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{t('settings')}</p>
          <h2>{t('accountTitle')}</h2>
          <p>{t('accountLead')}</p>
        </div>
      </div>

      <div className="account-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 18 }}>
        <form className="form-card" onSubmit={onSubmit}>
          <h3>{t('updateCreds')}</h3>
          <Field label={t('displayName')}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label={t('email')}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label={t('currentPassword')}>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </Field>
          <Field label={t('newPasswordOpt')}>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              minLength={6}
            />
          </Field>
          {error ? <div className="error">{error}</div> : null}
          {done ? <div className="muted" style={{ marginTop: 10 }}>{done}</div> : null}
          <button className="primary" type="submit" style={{ marginTop: 18 }}>
            {t('saveMadamAccount')}
          </button>
        </form>

        <aside className="card" style={{ padding: 20 }}>
          <em className="muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>
            {t('currentLogin')}
          </em>
          <p>
            <strong>{store.madam.name}</strong>
            <br />
            {store.madam.email}
          </p>
          <p>
            {t('password')}
            <br />
            <Secret value={store.madam.password} />
          </p>
        </aside>
      </div>
    </>
  )
}
