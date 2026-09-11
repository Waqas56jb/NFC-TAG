import { useEffect, useMemo, useState } from 'react'
import { availableYears, buildAnalytics, inRange, lastCompletedQuarter, prettyRange, rangeBounds } from '../lib/analytics'
import { listClassCards } from '../lib/school'
import { useI18n } from '../i18n/I18nContext'

const PRESETS = ['lastMonth', 'thisMonth', '6months', 'quarter', 'year']

export function AnalyticsBoard({
  sheets,
  students,
  grades,
  teachers = [],
  allowedCards = null,
  showSchool = false,
}) {
  const { t, lang } = useI18n()
  const now = useMemo(() => new Date(), [])
  const fallbackQ = lastCompletedQuarter(now)
  const [preset, setPreset] = useState('lastMonth')
  const [presetReady, setPresetReady] = useState(false)
  const [year, setYear] = useState(fallbackQ.year)
  const [quarter, setQuarter] = useState(fallbackQ.quarter)
  const [gradeId, setGradeId] = useState('')
  const [classKey, setClassKey] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const cards = useMemo(() => {
    const all = allowedCards || listClassCards(grades)
    return gradeId ? all.filter((c) => c.gradeId === gradeId) : all
  }, [allowedCards, grades, gradeId])

  const gradeOptions = useMemo(() => {
    const source = allowedCards || listClassCards(grades)
    const seen = new Map()
    source.forEach((c) => {
      if (!seen.has(c.gradeId)) seen.set(c.gradeId, c.gradeName)
    })
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [allowedCards, grades])

  const years = useMemo(() => availableYears(sheets, now), [sheets, now])
  const bounds = rangeBounds(preset, { year, quarter }, now)
  const scopedSheets = useMemo(() => {
    if (!allowedCards) return sheets
    const keys = new Set(allowedCards.map((c) => `${c.gradeId}:${c.sectionId}`))
    return sheets.filter((s) => keys.has(`${s.gradeId}:${s.sectionId}`))
  }, [allowedCards, sheets])

  useEffect(() => {
    if (presetReady) return
    const last = rangeBounds('lastMonth', {}, now)
    if (scopedSheets.some((s) => inRange(s.date, last.from, last.to))) {
      setPresetReady(true)
      return
    }
    const current = rangeBounds('thisMonth', {}, now)
    if (scopedSheets.some((s) => inRange(s.date, current.from, current.to))) {
      setPreset('thisMonth')
    } else if (scopedSheets.length) {
      setPreset('6months')
    }
    setPresetReady(true)
  }, [scopedSheets, now, presetReady])

  const data = useMemo(
    () =>
      buildAnalytics({
        sheets: scopedSheets,
        students,
        grades,
        teachers,
        from: bounds.from,
        to: bounds.to,
        gradeId,
        classKey,
        teacherId: showSchool ? teacherId : '',
        preset,
        locale: lang,
      }),
    [scopedSheets, students, grades, teachers, bounds.from, bounds.to, gradeId, classKey, teacherId, showSchool, preset, lang],
  )

  function changePreset(next) {
    setPreset(next)
    if (next === 'quarter') {
      setYear(fallbackQ.year)
      setQuarter(fallbackQ.quarter)
    }
    if (next === 'year') setYear(now.getFullYear())
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{t('analyticsEyebrow')}</p>
          <h2>{showSchool ? t('analyticsSchool') : t('analyticsMine')}</h2>
          <p>{showSchool ? t('analyticsSchoolLead') : t('analyticsMineLead')}</p>
        </div>
        <div className="range-pill">{prettyRange(data.from, data.to, lang)}</div>
      </div>

      <div className="toolbar analytics-filters">
        <div className="preset-row">
          {PRESETS.map((id) => (
            <button key={id} className={preset === id ? 'primary' : 'ghost'} onClick={() => changePreset(id)}>
              {t(`range_${id}`)}
            </button>
          ))}
        </div>
        <div className="preset-row">
          {preset === 'quarter' || preset === 'year' ? (
            <select className="search compact" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          ) : null}
          {preset === 'quarter' ? (
            <select className="search compact" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  {t(`quarter_${q}`)}
                </option>
              ))}
            </select>
          ) : null}
          <select
            className="search compact"
            value={gradeId}
            onChange={(e) => {
              setGradeId(e.target.value)
              setClassKey('')
            }}
          >
            <option value="">{t('filterAllGrades')}</option>
            {gradeOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select className="search compact" value={classKey} onChange={(e) => setClassKey(e.target.value)}>
            <option value="">{t('filterAllClasses')}</option>
            {cards.map((c) => (
              <option key={`${c.gradeId}:${c.sectionId}`} value={`${c.gradeId}:${c.sectionId}`}>
                {t('classTitle', { grade: c.gradeName, section: c.sectionName })}
              </option>
            ))}
          </select>
          {showSchool ? (
            <select className="search compact" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">{t('filterAllTeachers')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="stats analytics-kpis">
        <article className="stat">
          <em>{t('kpiRate')}</em>
          <b>{data.rate}%</b>
          <small>{t('kpiMarks', { count: data.total })}</small>
        </article>
        <article className="stat kpi-present">
          <em>{t('kpiPresent')}</em>
          <b>{data.counts.present}</b>
          <small>{t('kpiStudents', { count: data.unique.present })}</small>
        </article>
        <article className="stat kpi-absent">
          <em>{t('kpiAbsent')}</em>
          <b>{data.counts.absent}</b>
          <small>{t('kpiStudents', { count: data.unique.absent })}</small>
        </article>
        <article className="stat kpi-leave">
          <em>{t('kpiLeaves')}</em>
          <b>{data.leaves}</b>
          <small>{t('kpiStudents', { count: data.unique.leave })}</small>
        </article>
        <article className="stat">
          <em>{t('kpiDays')}</em>
          <b>{data.days}</b>
          <small>{t('kpiSheets')}</small>
        </article>
      </div>

      {data.total === 0 ? (
        <div className="card empty">{t('analyticsEmpty')}</div>
      ) : (
        <>
          <div className="analytics-grid">
            <section className="card chart-card">
              <h3>{t('chartMix')}</h3>
              <p className="muted">{t('chartMixHint')}</p>
              <Donut
                t={t}
                slices={[
                  { id: 'present', value: data.counts.present, color: '#2f6f4e' },
                  { id: 'absent', value: data.counts.absent, color: '#9a2e2e' },
                  { id: 'leaves', value: data.leaves, color: '#c47a3a' },
                ]}
              />
            </section>
            <section className="card chart-card">
              <h3>{t('chartTrend')}</h3>
              <p className="muted">{preset === 'lastMonth' || preset === 'thisMonth' ? t('chartTrendDaily') : t('chartTrendMonthly')}</p>
              <TrendChart rows={data.trend} t={t} />
            </section>
          </div>

          <div className="analytics-grid">
            <section className="card chart-card">
              <h3>{t('chartLeaves')}</h3>
              <p className="muted">{t('chartLeavesHint')}</p>
              <LeaveBars
                t={t}
                rows={[
                  { id: 'half-leave', value: data.counts['half-leave'] },
                  { id: 'full-leave', value: data.counts['full-leave'] },
                  { id: 'medical-leave', value: data.counts['medical-leave'] },
                ]}
              />
            </section>
            <section className="card chart-card">
              <h3>{showSchool ? t('chartByGrade') : t('chartByClass')}</h3>
              <p className="muted">{showSchool ? t('chartByGradeHint') : t('chartByClassHint')}</p>
              <CompareBars
                rows={(showSchool ? data.byGrade : data.byClass).map((row) => ({
                  name: showSchool ? row.name : t('classTitle', { grade: row.gradeName, section: row.sectionName }),
                  present: row.present,
                  absent: row.absent,
                  leaves: row.leaves,
                }))}
                t={t}
              />
            </section>
          </div>

          {showSchool && data.byTeacher.length ? (
            <section className="card table-wrap" style={{ marginBottom: 18 }}>
              <div className="chart-card" style={{ boxShadow: 'none', border: 0, paddingBottom: 0 }}>
                <h3>{t('chartByTeacher')}</h3>
                <p className="muted">{t('chartByTeacherHint')}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t('colTeacher')}</th>
                    <th>{t('kpiPresent')}</th>
                    <th>{t('kpiAbsent')}</th>
                    <th>{t('kpiLeaves')}</th>
                    <th>{t('kpiRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTeacher.map((row) => (
                    <tr key={row.name}>
                      <td>
                        <strong>{row.name}</strong>
                      </td>
                      <td>{row.present}</td>
                      <td>{row.absent}</td>
                      <td>{row.leaves}</td>
                      <td>{row.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          <div className="analytics-grid">
            <StudentTable title={t('topAbsent')} empty={t('noAbsents')} rows={data.topAbsent} field="absent" t={t} />
            <StudentTable title={t('topLeave')} empty={t('noLeaves')} rows={data.topLeave} field="leaves" t={t} />
          </div>
        </>
      )}
    </>
  )
}

function Donut({ slices, t }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1
  const size = 196
  const r = 68
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="donut" aria-hidden="true">
        <circle cx="98" cy="98" r={r} fill="none" stroke="#f3ead8" strokeWidth="22" />
        {slices.map((slice) => {
          const len = (slice.value / total) * c
          const dash = `${len} ${c - len}`
          const node = (
            <circle
              key={slice.id}
              cx="98"
              cy="98"
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 98 98)"
            />
          )
          offset += len
          return node
        })}
        <text x="98" y="94" textAnchor="middle" className="donut-num">
          {Math.round((slices[0].value / total) * 100)}%
        </text>
        <text x="98" y="116" textAnchor="middle" className="donut-cap">
          {t('kpiPresent')}
        </text>
      </svg>
      <ul className="legend">
        {slices.map((slice) => (
          <li key={slice.id}>
            <i style={{ background: slice.color }} />
            <span>{t(slice.id === 'leaves' ? 'kpiLeaves' : slice.id === 'present' ? 'kpiPresent' : 'kpiAbsent')}</span>
            <b>{slice.value}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrendChart({ rows, t }) {
  const max = Math.max(1, ...rows.map((r) => r.present + r.absent + r.leaves))
  const width = Math.max(520, rows.length * 36)
  const height = 220
  const pad = { t: 12, r: 12, b: 36, l: 8 }
  const innerH = height - pad.t - pad.b
  const gap = 8
  const barW = Math.max(10, (width - pad.l - pad.r) / rows.length - gap)

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" role="img" aria-label={t('chartTrend')}>
        {rows.map((row, i) => {
          const x = pad.l + i * (barW + gap)
          const presentH = (row.present / max) * innerH
          const absentH = (row.absent / max) * innerH
          const leaveH = (row.leaves / max) * innerH
          let y = height - pad.b
          const stacks = [
            { h: presentH, color: '#2f6f4e' },
            { h: absentH, color: '#9a2e2e' },
            { h: leaveH, color: '#c47a3a' },
          ]
          return (
            <g key={row.key}>
              {stacks.map((stack, idx) => {
                y -= stack.h
                return <rect key={idx} x={x} y={y} width={barW} height={Math.max(stack.h, 0)} rx="3" fill={stack.color} />
              })}
              <text x={x + barW / 2} y={height - 10} textAnchor="middle" className="tick">
                {row.label}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="legend compact">
        <li>
          <i style={{ background: '#2f6f4e' }} />
          {t('kpiPresent')}
        </li>
        <li>
          <i style={{ background: '#9a2e2e' }} />
          {t('kpiAbsent')}
        </li>
        <li>
          <i style={{ background: '#c47a3a' }} />
          {t('kpiLeaves')}
        </li>
      </ul>
    </div>
  )
}

function LeaveBars({ rows, t }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="leave-bars">
      {rows.map((row) => (
        <div key={row.id} className="leave-row">
          <span>{t(`status_${row.id.replaceAll('-', '_')}`)}</span>
          <div className="leave-track">
            <div className={`leave-fill ${row.id}`} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <b>{row.value}</b>
        </div>
      ))}
    </div>
  )
}

function CompareBars({ rows, t }) {
  if (!rows.length) return <div className="empty">{t('analyticsEmpty')}</div>
  const max = Math.max(1, ...rows.map((r) => r.present + r.absent + r.leaves))
  return (
    <div className="compare-bars">
      {rows.map((row) => (
        <div key={row.name} className="compare-row">
          <span>{row.name}</span>
          <div className="compare-track">
            <i className="present" style={{ width: `${(row.present / max) * 100}%` }} />
            <i className="absent" style={{ width: `${(row.absent / max) * 100}%` }} />
            <i className="leaves" style={{ width: `${(row.leaves / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StudentTable({ title, empty, rows, field, t }) {
  return (
    <section className="card table-wrap">
      <div className="chart-card" style={{ boxShadow: 'none', border: 0, paddingBottom: 0 }}>
        <h3>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('colStudent')}</th>
              <th>{t('classCard')}</th>
              <th>{t('kpiPresent')}</th>
              <th>{t('kpiAbsent')}</th>
              <th>{t('kpiLeaves')}</th>
              <th>{t('kpiRate')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="person-cell">
                    {row.photo ? <img className="avatar" src={row.photo} alt="" /> : <div className="avatar placeholder">{row.name.slice(0, 1)}</div>}
                    <strong>{row.name}</strong>
                  </div>
                </td>
                <td>{row.className}</td>
                <td>{row.present}</td>
                <td className={field === 'absent' ? 'hot' : ''}>{row.absent}</td>
                <td className={field === 'leaves' ? 'hot' : ''}>{row.leaves}</td>
                <td>{row.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
