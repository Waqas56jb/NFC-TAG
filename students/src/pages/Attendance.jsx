import { useMemo, useState } from 'react'
import { useStudent } from '../context/StudentContext'
import { useI18n } from '../i18n/I18nContext'
import { ATTENDANCE_STATUSES, classLabel, prettyDate, statusKey } from '../lib/school'

function weekday(iso, lang) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { weekday: 'short' })
}

function dayNum(iso) {
  const parts = String(iso || '').split('-')
  return parts[2] || '—'
}

export function Attendance() {
  const { student, grades, attendance } = useStudent()
  const { t, lang } = useI18n()
  const [filter, setFilter] = useState('all')
  if (!student) return null

  const klass = classLabel(grades, student.gradeId, student.sectionId)
  const counts = useMemo(() => {
    const next = { present: 0, absent: 0, leave: 0, days: attendance.length }
    attendance.forEach((row) => {
      if (row.status === 'present') next.present += 1
      else if (row.status === 'absent') next.absent += 1
      else if (row.status) next.leave += 1
    })
    return next
  }, [attendance])
  const rate = counts.days ? Math.round((counts.present / counts.days) * 100) : 0

  const rows = attendance.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'leave') return row.status && row.status !== 'present' && row.status !== 'absent'
    return row.status === filter
  })

  const chips = [
    { id: 'all', label: t('allStatuses') },
    { id: 'present', label: t('kpiPresent') },
    { id: 'absent', label: t('kpiAbsent') },
    { id: 'leave', label: t('kpiLeave') },
    ...ATTENDANCE_STATUSES.filter((s) => s.id !== 'present' && s.id !== 'absent').map((s) => ({
      id: s.id,
      label: t(statusKey(s.id)),
    })),
  ]

  return (
    <section className="app-screen attend-screen">
      <div className="attend-hero">
        <div className="attend-hero-copy">
          <p className="attend-kicker">{t('navAttendance')}</p>
          <h2>{student.name}</h2>
          <p>{klass || t('studentRole')}</p>
        </div>
        <div className="attend-ring" style={{ '--rate': `${rate}%` }} aria-label={`${rate}% ${t('attendRate')}`}>
          <div className="attend-ring-inner">
            <strong>{rate}%</strong>
            <span>{t('attendRate')}</span>
          </div>
        </div>
      </div>

      <div className="attend-kpi">
        <button type="button" className={`attend-kpi-card present ${filter === 'present' ? 'on' : ''}`} onClick={() => setFilter('present')}>
          <i className="kpi-ico" aria-hidden="true" />
          <span>{t('kpiPresent')}</span>
          <b>{counts.present}</b>
        </button>
        <button type="button" className={`attend-kpi-card absent ${filter === 'absent' ? 'on' : ''}`} onClick={() => setFilter('absent')}>
          <i className="kpi-ico" aria-hidden="true" />
          <span>{t('kpiAbsent')}</span>
          <b>{counts.absent}</b>
        </button>
        <button type="button" className={`attend-kpi-card leave ${filter === 'leave' ? 'on' : ''}`} onClick={() => setFilter('leave')}>
          <i className="kpi-ico" aria-hidden="true" />
          <span>{t('kpiLeave')}</span>
          <b>{counts.leave}</b>
        </button>
        <button type="button" className={`attend-kpi-card days ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
          <i className="kpi-ico" aria-hidden="true" />
          <span>{t('kpiDays')}</span>
          <b>{counts.days}</b>
        </button>
      </div>

      <div className="attend-chips" role="tablist" aria-label={t('allStatuses')}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={filter === chip.id}
            className={`attend-chip ${filter === chip.id ? 'on' : ''}`}
            onClick={() => setFilter(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="attend-sheet">
        <div className="attend-sheet-head">
          <h3>{t('attendHistory')}</h3>
          <span>{rows.length}</span>
        </div>
        {rows.length === 0 ? (
          <div className="attend-empty">{t('noAttendance')}</div>
        ) : (
          <div className="attend-rows">
            {rows.map((row) => (
              <article key={row.id} className={`attend-row status-${row.status || 'none'}`}>
                <div className="attend-cal" aria-hidden="true">
                  <em>{weekday(row.date, lang)}</em>
                  <b>{dayNum(row.date)}</b>
                </div>
                <div className="attend-row-body">
                  <strong>{prettyDate(row.date, lang)}</strong>
                  <p>{row.teacherName || '—'}</p>
                </div>
                {row.status ? (
                  <span className={`status-chip ${row.status}`}>{t(statusKey(row.status))}</span>
                ) : (
                  <span className="attend-unmarked">{t('notMarked')}</span>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
