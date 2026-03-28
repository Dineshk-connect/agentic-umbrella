import Sidebar from './Sidebar'

export default function Layout({ children, title, actions, pendingCount }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FC' }}>
      <Sidebar pendingCount={pendingCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: '52px',
          background: '#fff',
          borderBottom: '0.5px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{title}</span>
          {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
        </div>
        {/* Page content */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}