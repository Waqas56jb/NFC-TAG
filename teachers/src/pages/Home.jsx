import { Link } from 'react-router-dom'
import { useTeacher } from '../context/TeacherContext'
import { useI18n } from '../i18n/I18nContext'

export function Home() {
  const { teacher, classes } = useTeacher()
  const { t } = useI18n()

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{t('eyebrowDesk')}</p>
          <h2>{t('myClasses')}</h2>
          <p>{t('homeLead', { name: teacher.name })}</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="card empty">{t('noClasses')}</div>
      ) : (
        <div className="grade-grid">
          {classes.map((item) => (
            <Link key={item.id} className="card class-card class-card-link" to={item.path}>
              <em>{t('assignedClass')}</em>
              <h3>{t('classTitle', { grade: item.gradeName, section: item.sectionName })}</h3>
              <p className="muted">{t('studentsAttend', { count: item.studentCount })}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
