import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }) {
  const { isAuthed } = useAuth()
  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }
  return children
}
