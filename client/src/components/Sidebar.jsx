import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Icons = {
  overview: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  timesheets: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="11" rx="1.5"/><path d="M5 3V2M11 3V2"/><path d="M1 7h14"/></svg>,
  invoices: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>,
  payroll: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  payments: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="9" rx="1.5"/><path d="M1 7h14"/></svg>,
  compliance: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l5 2v5c0 3-2.5 5.5-5 7C5.5 13.5 3 11 3 8V3z"/></svg>,
  audit: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h8M2 12h5"/></svg>,
  payslips: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M5 5h6M5 8h6M5 11h3"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/></svg>,
}

const navByRole = {
  CONTRACTOR: [
    { section: 'My Work', items: [
      { label: 'Overview', icon: 'overview', path: '/contractor' },
      { label: 'Timesheets', icon: 'timesheets', path: '/contractor#timesheets' },
      { label: 'Payslips', icon: 'payslips', path: '/contractor#payslips' },
    ]},
  ],
  ADMIN_AGENCY: [
    { section: 'Workspace', items: [
      { label: 'Overview', icon: 'overview', path: '/agency' },
      { label: 'Timesheets', icon: 'timesheets', path: '/agency#timesheets' },
      { label: 'Invoices', icon: 'invoices', path: '/agency#invoices' },
    ]},
    { section: 'Finance', items: [
      { label: 'Payments', icon: 'payments', path: '/agency#payments' },
    ]},
  ],
  ADMIN_UMBRELLA: [
    { section: 'Workspace', items: [
      { label: 'Overview', icon: 'overview', path: '/umbrella' },
      { label: 'Payroll', icon: 'payroll', path: '/umbrella#payroll' },
    ]},
    { section: 'Compliance', items: [
      { label: 'HMRC', icon: 'compliance', path: '/umbrella#hmrc' },
      { label: 'Audit log', icon: 'audit', path: '/umbrella#audit' },
    ]},
  ],
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const membership = user?.memberships?.[0]
  const role = membership?.role
  const orgType = membership?.organisation?.type
  const name = user?.name ?? ''

  const navKey = role === 'CONTRACTOR' ? 'CONTRACTOR'
    : orgType === 'UMBRELLA' ? 'ADMIN_UMBRELLA'
    : 'ADMIN_AGENCY'

  const sections = navByRole[navKey] ?? []

  return (
    <div style={{
      width: '220px',
      background: '#0B2559',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      minHeight: '100vh'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '0.2px' }}>
          Agentic Umbrella
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
          Payroll Platform
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {sections.map(section => (
          <div key={section.section}>
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              padding: '10px 12px 4px'
            }}>
              {section.section}
            </div>
            {section.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '1px',
                  transition: 'all 0.15s'
                })}
              >
                <span style={{ opacity: 0.8, display: 'flex' }}>{Icons[item.icon]}</span>
                {item.label}
                {item.label === 'Timesheets' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{
        padding: '12px 16px',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: '#1E40AF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 600, color: '#fff',
          flexShrink: 0
        }}>
          {getInitials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
            {role}
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center',
            padding: '4px'
          }}
        >
          {Icons.logout}
        </button>
      </div>
    </div>
  )
}