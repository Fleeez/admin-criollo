import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ session, children }) {
  if (session === undefined) {
    return <div className="loading-screen" />
  }
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return children
}
