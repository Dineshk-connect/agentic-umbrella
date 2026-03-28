import { STATE_CONFIG } from '../styles/tokens'

export default function StateBadge({ state, size = 'sm' }) {
  const config = STATE_CONFIG[state] ?? { label: state, bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' }
  const fontSize = size === 'xs' ? '10px' : '11px'
  const padding = size === 'xs' ? '2px 7px' : '3px 9px'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: config.bg,
      color: config.text,
      fontSize,
      fontWeight: 500,
      padding,
      borderRadius: '20px',
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: '5px', height: '5px',
        borderRadius: '50%',
        background: config.dot,
        flexShrink: 0
      }}/>
      {config.label}
    </span>
  )
}