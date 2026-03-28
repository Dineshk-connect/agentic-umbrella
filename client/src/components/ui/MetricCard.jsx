export default function MetricCard({ label, value, sub, subColor }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E5E7EB',
      borderRadius: '10px',
      padding: '16px 20px'
    }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.2px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 500, color: '#111827', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: subColor ?? '#6B7280', marginTop: '5px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}