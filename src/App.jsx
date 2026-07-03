import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CompanyList from './pages/CompanyList'
import CompanyDetail from './pages/CompanyDetail'
import BatchSender from './pages/BatchSender'
import Settings from './pages/Settings'
import CSVImport from './pages/CSVImport'
import QuickDraft from './pages/QuickDraft'
import Profile from './pages/Profile'

export default function App() {
  const { user, loading } = useAuth()

  // Full-screen spinner while checking session
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    </div>
  )

  // Not signed in → show login
  if (!user) return <Login />

  // Signed in → show the app
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="batch" element={<BatchSender />} />
        <Route path="import" element={<CSVImport />} />
        <Route path="quick-draft" element={<QuickDraft />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}
