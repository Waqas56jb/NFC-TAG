import { useMemo, useState } from 'react'
import { Field, Modal } from '../components/Modal'
import { Secret } from '../components/Secret'
import { StudentLeavesPanel } from '../components/StudentLeavesPanel'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { listClassCards, prettyDate, prettyTime, todayKey } from '../lib/school'

const emptyForm = { name: '', email: '', password: '', subject: '' }

export function Teachers() {
  const { store, user, createTeacher, updateTeacherStatus, deleteTeacher, assignClass, hideAssignment, unassignClass, teacherDays, teacherLeaves, studentLeaves, reviewLeave, markStudentReturned, reviewStudentLeave } = useApp()
  const { t, tx, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [assigning, setAssigning] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('staff')
  const [dayDate, setDayDate] = useState(todayKey())
  const classes = listClassCards(store.grades)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.teachers.filter((t) =>
      `${t.name} ${t.email} ${t.subject}`.toLowerCase().includes(q),
    )
  }, [store.teachers, query])

  async function submit() {
    if (form.password.length < 6) {
      setError(t('passwordMin'))
      return
    }
    const result = await createTeacher(form)
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
          <h2>{t('teacherCreds')}</h2>
          <p>{t('teacherCredsLead')}</p>
        </div>
        {tab === 'staff' ? (
          <button className="primary" onClick={() => setOpen(true)}>
            {t('createTeacher')}
          </button>
        ) : null}
      </div>

      <div className="tabs">
        <button className={tab === 'staff' ? 'primary' : 'ghost'} onClick={() => setTab('staff')}>
          {t('tabStaff')}
        </button>
        <button className={tab === 'days' ? 'primary' : 'ghost'} onClick={() => setTab('days')}>
          {t('tabTeacherDays')}
        </button>
        <button className={tab === 'leaves' ? 'primary' : 'ghost'} onClick={() => setTab('leaves')}>
          {t('tabLeaves')}
          {teacherLeaves.filter((item) => item.status === 'pending').length ? (
            <i className="tab-count">{teacherLeaves.filter((item) => item.status === 'pending').length}</i>
          ) : null}
        </button>
        <button className={tab === 'passes' ? 'primary' : 'ghost'} onClick={() => setTab('passes')}>
          {t('tabStudentPasses')}
          {studentLeaves.filter((item) => item.status === 'pending').length ? (
            <i className="tab-count">{studentLeaves.filter((item) => item.status === 'pending').length}</i>
          ) : null}
        </button>
      </div>

      {tab === 'days' ? (
        <TeacherDaysPanel teachers={store.teachers} days={teacherDays} date={dayDate} setDate={setDayDate} t={t} lang={lang} />
      ) : null}

      {tab === 'leaves' ? (
        <TeacherLeavesPanel leaves={teacherLeaves} onReview={reviewLeave} t={t} lang={lang} />
      ) : null}

      {tab === 'passes' ? (
        <StudentLeavesPanel leaves={studentLeaves} onReturn={markStudentReturned} onReview={reviewStudentLeave} t={t} lang={lang} readOnly={!user} />
      ) : null}

      {tab === 'staff' ? (
      <>
      <div className="toolbar">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchTeacher')}
        />
      </div>

      <div className="table-wrap">
        {rows.length === 0 ? (
          <div className="empty">{t('noTeachers')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('colTeacher')}</th>
                <th>{t('colEmail')}</th>
                <th>{t('colPassword')}</th>
                <th>{t('colSubject')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colAssigned')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((teacher) => (
                <tr key={teacher.id}>
                  <td data-label={t('colTeacher')}>
                    <strong>{teacher.name}</strong>
                  </td>
                  <td data-label={t('colEmail')}>{teacher.email}</td>
                  <td data-label={t('colPassword')}>
                    <Secret value={teacher.password} />
                  </td>
                  <td data-label={t('colSubject')}>{teacher.subject}</td>
                  <td data-label={t('colStatus')}>
                    <span className={`badge ${teacher.status === 'active' ? 'on' : 'off'}`}>{teacher.status === 'active' ? t('active') : t('blocked')}</span>
                  </td>
                  <td data-label={t('colAssigned')}>
                    <div className="chip-wrap">
                      {(store.assignments || [])
                        .filter((a) => a.teacherId === teacher.id)
                        .map((a) => {
                          const card = classes.find((c) => c.gradeId === a.gradeId && c.sectionId === a.sectionId)
                          return (
                          <span key={a.id} className={`section-chip ${a.hidden ? 'dim' : ''}`}>
                            {card ? t('classTitle', { grade: card.gradeName, section: card.sectionName }) : t('classCard')}
                            {a.hidden ? t('hiddenSuffix') : ''}
                          </span>
                          )
                        })}
                      {(store.assignments || []).every((a) => a.teacherId !== teacher.id) ? (
                        <span className="muted">{t('noneYet')}</span>
                      ) : null}
                    </div>
                  </td>
                  <td data-label={t('colActions')}>
                    <div className="row-actions">
                      <button className="ghost" onClick={() => setAssigning(teacher)}>
                        {t('assign')}
                      </button>
                      {teacher.status === 'active' ? (
                        <button className="warn" onClick={() => updateTeacherStatus(teacher.id, 'blocked')}>
                          {t('block')}
                        </button>
                      ) : (
                        <button className="ghost" onClick={() => updateTeacherStatus(teacher.id, 'active')}>
                          {t('restore')}
                        </button>
                      )}
                      <button className="danger" onClick={() => deleteTeacher(teacher.id)}>
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
      </>
      ) : null}

      {open ? (
        <Modal
          title={t('newTeacher')}
          hint={t('signedInAs', { name: user.name })}
          onClose={() => {
            setOpen(false)
            setError('')
          }}
          onSubmit={submit}
          submitLabel={t('createCredentials')}
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
          <Field label={t('subject')}>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </Field>
          {error ? <div className="error">{error}</div> : null}
        </Modal>
      ) : null}

      {assigning ? (
        <Modal
          wide
          hideSubmit
          title={t('assignClasses', { name: assigning.name })}
          hint={t('assignHint')}
          onClose={() => setAssigning(null)}
        >
          {classes.length === 0 ? (
            <div className="empty">{t('createClassesFirst')}</div>
          ) : (
            <div className="assign-list">
              {classes.map((card) => {
                const assignment = (store.assignments || []).find(
                  (a) =>
                    a.teacherId === assigning.id &&
                    a.gradeId === card.gradeId &&
                    a.sectionId === card.sectionId,
                )
                return (
                  <div className="assign-row" key={`${card.gradeId}-${card.sectionId}`}>
                    <div>
                      <strong>{t('classTitle', { grade: card.gradeName, section: card.sectionName })}</strong>
                      <div className="muted">
                        {assignment
                          ? assignment.hidden
                            ? t('assignedHidden')
                            : t('assignedVisible')
                          : t('notAssigned')}
                      </div>
                    </div>
                    <div className="row-actions">
                      {assignment ? (
                        <>
                          <button className="warn" onClick={() => hideAssignment(assignment.id, !assignment.hidden)}>
                            {assignment.hidden ? t('show') : t('hide')}
                          </button>
                          <button className="danger" onClick={() => unassignClass(assignment.id)}>
                            {t('unassign')}
                          </button>
                        </>
                      ) : (
                        <button
                          className="primary"
                          onClick={() => assignClass(assigning.id, card.gradeId, card.sectionId)}
                        >
                          {t('assign')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Modal>
      ) : null}
    </>
  )
}

function hoursBetween(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  if (ms < 0) return '—'
  const h = Math.floor(ms / 3600000)
  const m = Math.round((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

function TeacherDaysPanel({ teachers, days, date, setDate, t, lang }) {
  const rows = teachers.map((teacher) => {
    const day = days.find((item) => item.teacherId === teacher.id && item.date === date)
    return { teacher, day }
  })
  return (
    <div className="card">
      <div className="toolbar">
        <input type="date" className="search" value={date} onChange={(e) => setDate(e.target.value)} />
        <span className="muted">{prettyDate(date, lang)}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('colTeacher')}</th>
              <th>{t('colCheckIn')}</th>
              <th>{t('colCheckOut')}</th>
              <th>{t('colHours')}</th>
              <th>{t('colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ teacher, day }) => (
              <tr key={teacher.id}>
                <td data-label={t('colTeacher')}><strong>{teacher.name}</strong><div className="muted">{teacher.subject}</div></td>
                <td data-label={t('colCheckIn')}>{prettyTime(day?.checkInAt, lang)}</td>
                <td data-label={t('colCheckOut')}>{prettyTime(day?.checkOutAt, lang)}</td>
                <td data-label={t('colHours')}>{hoursBetween(day?.checkInAt, day?.checkOutAt)}</td>
                <td data-label={t('colStatus')}>
                  <span className={`badge ${day?.checkInAt ? 'on' : 'off'}`}>
                    {day?.checkOutAt ? t('statusOut') : day?.checkInAt ? t('statusIn') : t('statusAbsent')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TeacherLeavesPanel({ leaves, onReview, t, lang }) {
  const [busyKey, setBusyKey] = useState('')
  if (leaves.length === 0) return <div className="card empty">{t('noLeavesYet')}</div>

  async function review(id, status) {
    if (busyKey) return
    setBusyKey(`${id}:${status}`)
    try {
      await onReview?.(id, status)
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div className="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>{t('colTeacher')}</th>
            <th>{t('colDates')}</th>
            <th>{t('colReason')}</th>
            <th>{t('colStatus')}</th>
            <th>{t('colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((item) => (
            <tr key={item.id}>
              <td data-label={t('colTeacher')}><strong>{item.teacherName}</strong></td>
              <td data-label={t('colDates')}>{prettyDate(item.startDate, lang)} — {prettyDate(item.endDate, lang)}</td>
              <td data-label={t('colReason')}>{item.reason || '—'}</td>
              <td data-label={t('colStatus')}><span className={`badge ${item.status === 'approved' ? 'on' : item.status === 'rejected' ? 'off' : ''}`}>{t(`leave_${item.status}`)}</span></td>
              <td data-label={t('colActions')}>
                {item.status === 'pending' ? (
                  <div className="row-actions">
                    <button
                      className={`primary${busyKey === `${item.id}:approved` ? ' is-loading' : ''}`}
                      disabled={Boolean(busyKey)}
                      onClick={() => review(item.id, 'approved')}
                    >
                      {busyKey === `${item.id}:approved` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                      <span>{busyKey === `${item.id}:approved` ? t('working') : t('approve')}</span>
                    </button>
                    <button
                      className={`danger${busyKey === `${item.id}:rejected` ? ' is-loading' : ''}`}
                      disabled={Boolean(busyKey)}
                      onClick={() => review(item.id, 'rejected')}
                    >
                      {busyKey === `${item.id}:rejected` ? <span className="btn-spinner" aria-hidden="true" /> : null}
                      <span>{busyKey === `${item.id}:rejected` ? t('working') : t('reject')}</span>
                    </button>
                  </div>
                ) : (
                  <span className="muted">{item.reviewedByName || '—'}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
