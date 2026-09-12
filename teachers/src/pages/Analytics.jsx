import { AnalyticsBoard } from '../components/AnalyticsBoard'
import { useTeacher } from '../context/TeacherContext'

export function Analytics() {
  const { school, classes } = useTeacher()
  return (
    <section className="app-screen analytics-page">
      <AnalyticsBoard
        sheets={school.attendance || []}
        students={school.students || []}
        grades={school.grades || []}
        allowedCards={classes}
      />
    </section>
  )
}
