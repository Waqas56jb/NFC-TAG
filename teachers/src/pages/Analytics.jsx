import { AnalyticsBoard } from '../components/AnalyticsBoard'
import { useTeacher } from '../context/TeacherContext'

export function Analytics() {
  const { school, classes } = useTeacher()
  return (
    <AnalyticsBoard
      sheets={school.attendance || []}
      students={school.students || []}
      grades={school.grades || []}
      allowedCards={classes}
    />
  )
}
