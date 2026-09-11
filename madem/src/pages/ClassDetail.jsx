import { useMemo, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { AttendanceBoard } from '../components/AttendanceBoard'
import { Crumbs } from '../components/Crumbs'
import { Modal } from '../components/Modal'
import { StaffDmModal } from '../components/StaffDmModal'
import { StudentForm, StudentView } from '../components/StudentForm'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { resolveClassRoute } from '../lib/school'
import { emptyStudent, studentFromRecord } from '../lib/studentFields'

export function ClassDetail() {
  const { gradeSlug, sectionSlug } = useParams()
  const location = useLocation()
  const { store, user, createStudent, updateStudent, deleteStudent, saveAttendance, openDmThread, loadDmMessages, postDmMessage } = useApp()
  const { t, tx } = useI18n()
  const match = resolveClassRoute(store.grades, gradeSlug, sectionSlug)
  const gradeId = match?.gradeId
  const sectionId = match?.sectionId
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [messaging, setMessaging] = useState(null)
  const [form, setForm] = useState(emptyStudent)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('students')

  const grade = (store.grades || []).find((g) => g.id === gradeId)
  const section = grade?.sections.find((s) => s.id === sectionId)

  const students = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (store.students || [])
      .filter((s) => s.gradeId === gradeId && s.sectionId === sectionId)
      .filter((s) =>
        `${s.name} ${s.parentPhone} ${s.nic} ${s.parentName} ${s.rollNo}`.toLowerCase().includes(q),
      )
  }, [store.students, gradeId, sectionId, query])

  if (!match) return <Navigate to="/classes" replace />
  if (location.pathname !== match.path) return <Navigate to={match.path} replace />
  if (!grade || !section) return <Navigate to="/classes" replace />

  function openCreate() {
    setEditing(null)
    setForm(emptyStudent)
    setError('')
    setFormOpen(true)
  }

  function openEdit(student) {
    setViewing(null)
    setEditing(student)
    setForm(studentFromRecord(student))
    setError('')
    setFormOpen(true)
  }

  async function submit() {
    const result = editing
      ? await updateStudent(editing.id, form)
      : await createStudent(gradeId, sectionId, form)
    if (!result.ok) {
      setError(tx(result.error))
      return
    }
    setFormOpen(false)
    setEditing(null)
    setForm(emptyStudent)
    setError('')
  }

  return (
    <>
      <div className="topbar">
        <div>
          <Crumbs
            items={[
              { label: t('crumbsClasses'), to: '/classes' },
              { label: grade.name },
              { label: t('sectionOf', { name: section.name }) },
            ]}
          />
          <h2>
            {t('classTitle', { grade: grade.name, section: section.name })}
          </h2>
          <p>{t('classDetailLead')}</p>
        </div>
        {tab === 'students' ? (
          <button className="primary" onClick={openCreate}>
            {t('addStudent')}
          </button>
        ) : null}
      </div>

      <div className="tabs">
        <button className={tab === 'students' ? 'primary' : 'ghost'} onClick={() => setTab('students')}>
          {t('tabStudents')}
        </button>
        <button className={tab === 'attendance' ? 'primary' : 'ghost'} onClick={() => setTab('attendance')}>
          {t('tabAttendance')}
        </button>
      </div>

      {tab === 'attendance' ? (
        <AttendanceBoard
          students={(store.students || []).filter((s) => s.gradeId === gradeId && s.sectionId === sectionId)}
          sheets={store.attendance || []}
          gradeId={gradeId}
          sectionId={sectionId}
          onSave={saveAttendance}
        />
      ) : (
      <>
      <div className="toolbar">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchStudent')}
        />
        <span className="muted">{t('studentsCount', { count: students.length })}</span>
      </div>

      <div className="table-wrap">
        {students.length === 0 ? (
          <div className="empty">{t('noStudentsClass')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('colStudent')}</th>
                <th>{t('colAge')}</th>
                <th>{t('colParentPhone')}</th>
                <th>{t('colNic')}</th>
                <th>{t('colRoll')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="person-cell">
                      {student.photo ? (
                        <img className="avatar" src={student.photo} alt="" />
                      ) : (
                        <div className="avatar placeholder">{student.name.slice(0, 1)}</div>
                      )}
                      <div>
                        <strong>{student.name}</strong>
                        <div className="muted">{student.parentName || t('noParentName')}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.age || '—'}</td>
                  <td>{student.parentPhone || '—'}</td>
                  <td>{student.nic || '—'}</td>
                  <td>{student.rollNo || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="ghost" onClick={() => setViewing(student)}>
                        {t('view')}
                      </button>
                      <button className="ghost" onClick={() => setMessaging(student)}>
                        {t('message')}
                      </button>
                      <button className="ghost" onClick={() => openEdit(student)}>
                        {t('edit')}
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          if (window.confirm(t('confirmDeleteStudent', { name: student.name }))) deleteStudent(student.id)
                        }}
                      >
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
      )}

      {formOpen ? (
        <Modal
          wide
          title={editing ? t('editStudent') : t('addStudent')}
          hint={t('saveInto', { grade: grade.name, section: section.name, name: user.name })}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
            setError('')
          }}
          onSubmit={submit}
          submitLabel={editing ? t('saveChanges') : t('addStudent')}
        >
          <StudentForm form={form} setForm={setForm} error={error} setError={setError} />
        </Modal>
      ) : null}

      {viewing ? (
        <Modal
          wide
          hideSubmit
          title={t('studentRecord')}
          hint={t('classTitle', { grade: grade.name, section: section.name })}
          onClose={() => setViewing(null)}
        >
          <StudentView student={viewing} />
          <div className="modal-actions" style={{ paddingTop: 0 }}>
            <button className="primary" type="button" onClick={() => openEdit(viewing)}>
              {t('editThisStudent')}
            </button>
          </div>
        </Modal>
      ) : null}

      <StaffDmModal
        open={Boolean(messaging)}
        student={messaging}
        user={user}
        onClose={() => setMessaging(null)}
        openThread={openDmThread}
        loadMessages={loadDmMessages}
        onPost={postDmMessage}
      />
    </>
  )
}
