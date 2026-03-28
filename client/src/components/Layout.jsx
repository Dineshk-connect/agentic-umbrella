import { useAuth } from '../context/AuthContext'

export default function Layout({ children, title }) {
  const { user, logout } = useAuth()
  const role = user?.memberships?.[0]?.role

  const roleColors = {
    CONTRACTOR: 'bg-teal-600',
    ADMIN: 'bg-blue-600',
    CONSULTANT: 'bg-blue-500',
    PAYROLL_OPERATOR: 'bg-purple-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={`${roleColors[role] ?? 'bg-gray-800'} text-white px-6 py-4 flex justify-between items-center`}>
        <div>
          <span className="font-bold text-lg">Agentic Umbrella</span>
          <span className="ml-3 text-sm opacity-75">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.name}</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">{role}</span>
          <button
            onClick={logout}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}   