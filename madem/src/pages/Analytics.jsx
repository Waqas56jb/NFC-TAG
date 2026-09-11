import { AnalyticsBoard } from '../components/AnalyticsBoard'
import { useApp } from '../context/AppContext'

export function Analytics() {
  const { store } = useApp()
  return (
    <AnalyticsBoard
      showSchool
      sheets={store.attendance || []}
      students={store.students || []}
      grades={store.grades || []}
      teachers={store.teachers || []}
    />
  )
}
