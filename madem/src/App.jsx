import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AppProvider, useApp } from './context/AppContext'
import { Account } from './pages/Account'
import { Activity } from './pages/Activity'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { SubUsers } from './pages/SubUsers'
import { ClassDetail } from './pages/ClassDetail'
import { Classes } from './pages/Classes'
import { Teachers } from './pages/Teachers'
import { Analytics } from './pages/Analytics'
import { Groups } from './pages/Groups'

function Guard({ children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  return children
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
        <Route path="/" element={<Dashboard />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/classes/:gradeSlug/:sectionSlug" element={<ClassDetail />} />
        <Route path="/sub-users" element={<SubUsers />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/account" element={<Account />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
