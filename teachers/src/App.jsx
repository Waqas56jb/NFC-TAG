import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { FeedbackChrome } from './components/Feedback'
import { Layout } from './components/Layout'
import { TeacherProvider, useTeacher } from './context/TeacherContext'
import { resolveClassRoute } from './lib/school'
import { ClassRoom } from './pages/ClassRoom'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Analytics } from './pages/Analytics'
import { Groups } from './pages/Groups'
import { Desk } from './pages/Desk'

function Guard({ children }) {
  const { teacher } = useTeacher()
  if (!teacher) return <Navigate to="/login" replace />
  return children
}

function LegacyClassRedirect() {
  const { gradeId, sectionId } = useParams()
  const { school } = useTeacher()
  const match = resolveClassRoute(school.grades, gradeId, sectionId)
  return <Navigate to={match?.path || '/classes'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/desk" element={<Desk />} />
        <Route path="/classes" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/classes/:gradeSlug/:sectionSlug" element={<ClassRoom />} />
        <Route path="/c/:gradeId/:sectionId" element={<LegacyClassRedirect />} />
        <Route path="/" element={<Navigate to="/desk" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/desk" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <TeacherProvider>
      <BrowserRouter>
        <FeedbackChrome />
        <AppRoutes />
      </BrowserRouter>
    </TeacherProvider>
  )
}
