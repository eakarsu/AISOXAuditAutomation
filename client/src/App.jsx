import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FeaturePage from './pages/FeaturePage'
import Layout from './components/Layout'
import { featureConfigs } from './pages/featureConfigs'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {Object.entries(featureConfigs).map(([key, config]) => (
        <Route
          key={key}
          path={`/${key}`}
          element={<ProtectedRoute><FeaturePage config={config} key={key} /></ProtectedRoute>}
        />
      ))}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
