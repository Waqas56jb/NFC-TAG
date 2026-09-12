import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Field, Modal } from '../components/Modal'
import { Secret } from '../components/Secret'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'

const emptyForm = { name: '', email: '', password: '' }

export function SubUsers() {
  const { isMadam, store, createSubUser, updateSubUserStatus, deleteSubUser } = useApp()
  const { t, tx } = useI18n()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  if (!isMadam) return <Navigate to="/" replace />

  async function submit() {
    if (form.password.length < 6) {
      setError(t('passwordMin'))
      return
    }
    const result = await createSubUser(form)
    if (!result.ok) {
      setError(tx(result.error))
      return
    }
    setForm(emptyForm)
    setError('')
    setOpen(false)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{t('people')}</p>
          <h2>{t('subUsersTitle')}</h2>
          <p>{t('subUsersLead')}</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          {t('createSubUser')}
        </button>
      </div>

      <div className="table-wrap">
        {store.subUsers.length === 0 ? (
          <div className="empty">{t('noSubUsers')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colEmail')}</th>
                <th>{t('colPassword')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {store.subUsers.map((s) => (
                <tr key={s.id}>
                  <td data-label={t('colName')}>
                    <strong>{s.name}</strong>
                  </td>
                  <td data-label={t('colEmail')}>{s.email}</td>
                  <td data-label={t('colPassword')}>
                    <Secret value={s.password} />
                  </td>
                  <td data-label={t('colStatus')}>
                    <span className={`badge ${s.status === 'active' ? 'on' : 'off'}`}>{s.status === 'active' ? t('active') : t('blocked')}</span>
                  </td>
                  <td data-label={t('colActions')}>
                    <div className="row-actions">
                      {s.status === 'active' ? (
                        <button className="warn" onClick={() => updateSubUserStatus(s.id, 'blocked')}>
                          {t('block')}
                        </button>
                      ) : (
                        <button className="ghost" onClick={() => updateSubUserStatus(s.id, 'active')}>
                          {t('restore')}
                        </button>
                      )}
                      <button className="danger" onClick={() => deleteSubUser(s.id)}>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <Modal
          title={t('newSubUser')}
          hint={t('newSubHint')}
          onClose={() => {
            setOpen(false)
            setError('')
          }}
          onSubmit={submit}
          submitLabel={t('createSubUser')}
        >
          <Field label={t('fullName')}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label={t('loginEmail')}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label={t('password')}>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </Field>
          {error ? <div className="error">{error}</div> : null}
        </Modal>
      ) : null}
    </>
  )
}
