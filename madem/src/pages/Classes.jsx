import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, Modal } from '../components/Modal'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { classPath } from '../lib/school'

function sortClasses(list) {
  return [...list].sort((a, b) => {
    const na = a.gradeName.match(/\d+/)
    const nb = b.gradeName.match(/\d+/)
    if (na && nb && Number(na[0]) !== Number(nb[0])) return Number(na[0]) - Number(nb[0])
    const gradeCmp = a.gradeName.localeCompare(b.gradeName)
    if (gradeCmp !== 0) return gradeCmp
    return a.sectionName.localeCompare(b.sectionName)
  })
}

export function Classes() {
  const { store, user, createClass, deleteClass } = useApp()
  const { t, tx } = useI18n()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ grade: '', section: '' })
  const [error, setError] = useState('')

  const gradeNames = useMemo(
    () => [...new Set((store.grades || []).map((g) => g.name))],
    [store.grades],
  )

  const classes = useMemo(() => {
    const rows = (store.grades || []).flatMap((grade) =>
      grade.sections.map((section) => ({
        key: `${grade.id}-${section.id}`,
        gradeId: grade.id,
        sectionId: section.id,
        gradeName: grade.name,
        sectionName: section.name,
        createdByName: section.createdByName,
        createdAt: section.createdAt,
        studentCount: (store.students || []).filter(
          (s) => s.gradeId === grade.id && s.sectionId === section.id,
        ).length,
      })),
    )
    const q = query.trim().toLowerCase()
    return sortClasses(
      rows.filter((row) =>
        `${row.gradeName} section ${row.sectionName}`.toLowerCase().includes(q),
      ),
    )
  }, [store.grades, store.students, query])

  async function submit() {
    const result = await createClass(form.grade, form.section)
    if (!result.ok) {
      setError(tx(result.error))
      return
    }
    setForm({ grade: '', section: '' })
    setError('')
    setOpen(false)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{t('schoolEyebrow')}</p>
          <h2>{t('classesTitle')}</h2>
          <p>{t('classesLead')}</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setForm({ grade: '', section: '' })
            setError('')
            setOpen(true)
          }}
        >
          {t('createClass')}
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchClass')}
        />
        <span className="muted">{t('classCardsCount', { count: classes.length })}</span>
      </div>

      {classes.length === 0 ? (
        <div className="card empty">{t('noClasses')}</div>
      ) : (
        <div className="grade-grid">
          {classes.map((item) => (
            <article className="card class-card" key={item.key}>
              <Link className="class-card-link" to={classPath(item.gradeName, item.sectionName)}>
                <div className="class-card-top">
                  <em>{t('classCard')}</em>
                  <span className="class-count">{item.studentCount}</span>
                </div>
                <h3>{t('classTitle', { grade: item.gradeName, section: item.sectionName })}</h3>
                <p className="muted">
                  {item.studentCount === 1 ? t('studentOpenOne') : t('studentsOpen', { count: item.studentCount })}
                </p>
              </Link>
              <div className="row-actions">
                <Link className="ghost" to={classPath(item.gradeName, item.sectionName)}>
                  {t('openClass')}
                </Link>
                <button
                  className="danger"
                  onClick={() => {
                    if (window.confirm(t('confirmDeleteClass', { grade: item.gradeName, section: item.sectionName }))) {
                      deleteClass(item.gradeId, item.sectionId)
                    }
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open ? (
        <Modal
          title={t('newClass')}
          hint={t('newClassHint', { name: user.name })}
          onClose={() => {
            setOpen(false)
            setError('')
          }}
          onSubmit={submit}
          submitLabel={t('createClass')}
        >
          <Field label={t('grade')}>
            <input
              list="grade-options"
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              placeholder={t('gradePh')}
              required
            />
          </Field>
          <datalist id="grade-options">
            {gradeNames.map((name) => (
              <option value={name} key={name} />
            ))}
          </datalist>
          <Field label={t('section')}>
            <input
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              placeholder={t('sectionPh')}
              required
            />
          </Field>
          {error ? <div className="error">{error}</div> : null}
        </Modal>
      ) : null}
    </>
  )
}
