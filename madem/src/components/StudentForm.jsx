import { Field } from './Modal'
import { useI18n } from '../i18n/I18nContext'
import { readPhoto } from '../lib/photo'
import { genderLabel } from '../i18n/helpers'

export function StudentForm({ form, setForm, error, setError }) {
  const { t, tx } = useI18n()

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const photo = await readPhoto(file)
      setForm((prev) => ({ ...prev, photo }))
      setError('')
    } catch (err) {
      setError(tx(err.message))
    }
  }

  return (
    <>
      <div className="photo-pick">
        {form.photo ? (
          <img className="avatar-lg" src={form.photo} alt="" />
        ) : (
          <div className="avatar-lg placeholder">{t('noPhoto')}</div>
        )}
        <div>
          <label className="ghost" style={{ display: 'inline-block' }}>
            {form.photo ? t('changePhoto') : t('uploadPhoto')}
            <input type="file" accept="image/*" hidden onChange={onPhoto} />
          </label>
          {form.photo ? (
            <button type="button" className="linkish" style={{ marginInlineStart: 12 }} onClick={() => setForm((p) => ({ ...p, photo: '' }))}>
              {t('remove')}
            </button>
          ) : (
            <p className="muted" style={{ margin: '8px 0 0' }}>{t('photoHint')}</p>
          )}
        </div>
      </div>

      <div className="form-grid">
        <Field label={t('studentName')}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label={t('age')}>
          <input type="number" min="1" max="30" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </Field>
        <Field label={t('gender')}>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">{t('select')}</option>
            <option value="Boy">{t('boy')}</option>
            <option value="Girl">{t('girl')}</option>
            <option value="Other">{t('other')}</option>
          </select>
        </Field>
        <Field label={t('dob')}>
          <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </Field>
        <Field label={t('nic')}>
          <input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} placeholder="35202-xxxxxxx-x" />
        </Field>
        <Field label={t('rollNo')}>
          <input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
        </Field>
        <Field label={t('bloodGroup')}>
          <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            <option value="">{t('select')}</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label={t('allergies')}>
          <input
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder={t('allergiesHint')}
          />
        </Field>
        <Field label={t('parentName')}>
          <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
        </Field>
        <Field label={t('parentPhone')}>
          <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="03xx-xxxxxxx" />
        </Field>
        <Field label={t('parentEmail')}>
          <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
        </Field>
        <Field label={t('emergencyPhone')}>
          <input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
        </Field>
        <Field label={t('address')}>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
      </div>
      <Field label={t('notes')}>
        <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <p className="muted" style={{ marginTop: 10 }}>{t('studentFormHint')}</p>
      {error ? <div className="error">{error}</div> : null}
    </>
  )
}

export function StudentView({ student }) {
  const { t, lang } = useI18n()
  const rows = [
    [t('age'), student.age],
    [t('gender'), genderLabel(student.gender, t)],
    [t('dob'), student.dob],
    [t('nic'), student.nic],
    [t('rollNo'), student.rollNo],
    [t('studentLogin'), student.loginEmail],
    [t('studentPassword'), student.loginPassword],
    [t('bloodGroup'), student.bloodGroup],
    [t('allergies'), student.allergies],
    [t('parentGuardian'), student.parentName],
    [t('parentPhone'), student.parentPhone],
    [t('parentEmail'), student.parentEmail],
    [t('emergencyPhone'), student.emergencyPhone],
    [t('address'), student.address],
    [t('notes'), student.notes],
  ]

  return (
    <div className="student-view">
      <div className="photo-pick">
        {student.photo ? (
          <img className="avatar-lg" src={student.photo} alt={student.name} />
        ) : (
          <div className="avatar-lg placeholder">{student.name.slice(0, 1)}</div>
        )}
        <div>
          <strong>{student.name}</strong>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {t('addedBy', { name: student.createdByName })}
            {student.updatedAt
              ? t('updatedOn', { date: new Date(student.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en') })
              : ''}
          </p>
        </div>
      </div>
      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
