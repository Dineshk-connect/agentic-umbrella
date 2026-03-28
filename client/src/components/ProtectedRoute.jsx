import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />

  const userRoles = user.memberships?.map(m => m.role) ?? []
  const hasRole = roles.some(r => userRoles.includes(r))
  if (!hasRole) return <Navigate to="/login" />

  return children
}