import { useMemo, useState } from 'react'
import { useTeacher } from '../context/TeacherContext'
import { useI18n } from '../i18n/I18nContext'
import { prettyDate, prettyTime, todayKey } from '../lib/school'

function hoursBetween(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  if (ms < 0) return '—'
  const h = Math.floor(ms / 3600000)
  const m = Math.round((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export function Desk() {
  const { teacher, teacherDays, teacherLeaves, checkIn, checkOut, requestLeave } = useTeacher()
  const { t, lang } = useI18n()
  const [form, setForm] = useState({ startDate: todayKey(), endDate: todayKey(), reason: '' })
  const [busy, setBusy] = useState('')
  const today = todayKey()
  const mine = useMemo(
    () => teacherDays.filter((d) => d.teacherId === teacher.id).sort((a, b) => b.date.localeCompare(a.date)),
    [teacherDays, teacher.id],
  )
  const todayRow = mine.find((d) => d.date === today)
  const leaves = teacherLeaves.filter((item) => item.teacherId === teacher.id)
  const checkedIn = Boolean(todayRow?.checkInAt)
  const checkedOut = Boolean(todayRow?.checkOutAt)
  const statusLabel = checkedOut ? t('statusOut') : checkedIn ? t('statusIn') : t('statusAway')

  async function onCheckIn() {
    setBusy('in')
    await checkIn()
    setBusy('')
  }

  async function onCheckOut() {
    setBusy('out')
    await checkOut()
    setBusy('')
  }

  async function submitLeave(e) {
    e.preventDefault()
    setBusy('leave')
    const result = await requestLeave(form)
    setBusy('')
    if (result?.ok) setForm({ startDate: todayKey(), endDate: todayKey(), reason: '' })
  }

  return (
    <section className="desk-page">
      <header className="page-head">
        <p className="eyebrow">{t('deskEyebrow')}</p>
        <h2>{t('deskTitle')}</h2>
        <p className="muted">{t('deskLead', { name: teacher.name })}</p>
      </header>

      <article className="card desk-hero">
        <div className="desk-hero-top">
          <div>
            <p className="desk-date">{prettyDate(today, lang)}</p>
            <p className="muted">{t('deskTodayHint')}</p>
          </div>
          <span className={`desk-status ${checkedOut ? 'out' : checkedIn ? 'in' : 'away'}`}>{statusLabel}</span>
        </div>

        <div className="desk-times">
          <div className="desk-time">
            <span>{t('colCheckIn')}</span>
            <b>{prettyTime(todayRow?.checkInAt, lang)}</b>
          </div>
          <div className="desk-time">
            <span>{t('colCheckOut')}</span>
            <b>{prettyTime(todayRow?.checkOutAt, lang)}</b>
          </div>
          <div className="desk-time">
            <span>{t('colHours')}</span>
            <b>{hoursBetween(todayRow?.checkInAt, todayRow?.checkOutAt)}</b>
          </div>
        </div>

        <div className="desk-actions">
          <button className="primary" disabled={checkedIn || busy === 'in'} onClick={onCheckIn}>
            {busy === 'in' ? t('saving') : t('checkIn')}
          </button>
          <button className="ghost" disabled={!checkedIn || checkedOut || busy === 'out'} onClick={onCheckOut}>
            {busy === 'out' ? t('saving') : t('checkOut')}
          </button>
        </div>
      </article>

      <div className="desk-grid">
        <section className="card desk-panel">
          <div className="desk-panel-head">
            <h3>{t('myDays')}</h3>
            <p className="muted">{t('myDaysHint')}</p>
          </div>
          {mine.length === 0 ? (
            <div className="empty soft">{t('noTeacherDays')}</div>
          ) : (
            <div className="table-wrap desk-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('colDate')}</th>
                    <th>{t('colCheckIn')}</th>
                    <th>{t('colCheckOut')}</th>
                    <th>{t('colHours')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.slice(0, 20).map((row) => (
                    <tr key={row.id}>
                      <td data-label={t('colDate')}>{prettyDate(row.date, lang)}</td>
                      <td data-label={t('colCheckIn')}>{prettyTime(row.checkInAt, lang)}</td>
                      <td data-label={t('colCheckOut')}>{prettyTime(row.checkOutAt, lang)}</td>
                      <td data-label={t('colHours')}>{hoursBetween(row.checkInAt, row.checkOutAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card desk-panel">
          <div className="desk-panel-head">
            <h3>{t('requestLeave')}</h3>
            <p className="muted">{t('requestLeaveHint')}</p>
          </div>
          <form className="leave-form" onSubmit={submitLeave}>
            <div className="leave-dates">
              <label className="field">
                <span>{t('leaveFrom')}</span>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </label>
              <label className="field">
                <span>{t('leaveTo')}</span>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </label>
            </div>
            <label className="field">
              <span>{t('leaveReason')}</span>
              <textarea rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t('leaveReasonHint')} />
            </label>
            <button className="primary" type="submit" disabled={busy === 'leave'}>
              {busy === 'leave' ? t('saving') : t('sendLeave')}
            </button>
          </form>
          <div className="leave-mine">
            {leaves.length === 0 ? (
              <div className="empty soft">{t('noMyLeaves')}</div>
            ) : (
              leaves.map((item) => (
                <article key={item.id} className="leave-item">
                  <div>
                    <strong>
                      {prettyDate(item.startDate, lang)} — {prettyDate(item.endDate, lang)}
                    </strong>
                    {item.reason ? <p className="muted">{item.reason}</p> : null}
                  </div>
                  <span className={`badge ${item.status === 'approved' ? 'on' : item.status === 'rejected' ? 'off' : ''}`}>
                    {t(`leave_${item.status}`)}
                  </span>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
