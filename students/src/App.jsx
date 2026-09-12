import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FeedbackChrome } from './components/Feedback'
import { Layout } from './components/Layout'
import { StudentProvider, useStudent } from './context/StudentContext'
import { Attendance } from './pages/Attendance'
import { Groups } from './pages/Groups'
import { Leave } from './pages/Leave'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { PublicChild } from './pages/PublicChild'

function Guard({ children }) {
  const { student } = useStudent()
  if (!student) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/c/:code" element={<PublicChild />} />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/profile" element={<Profile />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/" element={<Navigate to="/profile" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StudentProvider>
      <BrowserRouter>
        <FeedbackChrome />
        <AppRoutes />
      </BrowserRouter>
    </StudentProvider>
  )
}
