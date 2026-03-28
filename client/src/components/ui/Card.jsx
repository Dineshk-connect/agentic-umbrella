export default function Card({ children, title, action, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E5E7EB',
      borderRadius: '10px',
      padding: '18px 20px',
      ...style
    }}>
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}