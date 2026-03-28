function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = [
  { bg: '#DBEAFE', color: '#1E40AF' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#EDE9FE', color: '#5B21B6' },
  { bg: '#FEF3C7', color: '#92400E' },
]

function hashColor(str = '') {
  const i = str.charCodeAt(0) % avatarColors.length
  return avatarColors[i]
}

export default function ActivityFeed({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px 0' }}>
        No activity yet
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {logs.map((log, i) => {
        const name = log.actor?.name ?? 'System'
        const colors = hashColor(name)
        const label = log.eventType?.replace(/_/g, ' ').toLowerCase()

        return (
          <div key={log.id ?? i}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: colors.bg,
                color: colors.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 600,
                flexShrink: 0
              }}>
                {getInitials(name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  {' · '}
                  <span style={{ color: '#6B7280' }}>{label}</span>
                </div>
                {log.metadata && typeof log.metadata === 'object' && (
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                    {log.metadata.amount && `£${Number(log.metadata.amount).toFixed(2)}`}
                    {log.metadata.invoiceNumber && ` · ${log.metadata.invoiceNumber}`}
                    {log.metadata.netPay && ` · net £${Number(log.metadata.netPay).toFixed(2)}`}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#D1D5DB', marginTop: '2px' }}>
                  {new Date(log.createdAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            {i < logs.length - 1 && (
              <div style={{ height: '0.5px', background: '#F3F4F6', margin: '10px 0 0 38px' }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}