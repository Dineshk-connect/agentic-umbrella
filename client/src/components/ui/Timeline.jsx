import { PIPELINE_STEPS, STATE_CONFIG } from '../../styles/tokens'

export default function Timeline({ currentState, events = [] }) {
  const currentIndex = PIPELINE_STEPS.indexOf(currentState)

  const eventMap = {}
  events.forEach(e => { eventMap[e.afterState] = e })

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {PIPELINE_STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex
        const isPending = i > currentIndex
        const config = STATE_CONFIG[step]
        const event = eventMap[step]

        return (
          <div key={step} style={{ display: 'flex', gap: '12px', paddingBottom: i < PIPELINE_STEPS.length - 1 ? '14px' : 0 }}>
            {/* Left: dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
              <div style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                marginTop: '3px',
                flexShrink: 0,
                background: isDone ? '#10B981' : isActive ? '#1A56DB' : '#D1D5DB',
                boxShadow: isActive ? '0 0 0 3px #DBEAFE' : 'none'
              }}/>
              {i < PIPELINE_STEPS.length - 1 && (
                <div style={{
                  width: '1px',
                  flex: 1,
                  background: isDone ? '#10B981' : '#E5E7EB',
                  marginTop: '4px',
                  minHeight: '18px'
                }}/>
              )}
            </div>
            {/* Right: content */}
            <div style={{ flex: 1, paddingBottom: '2px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: isPending ? '#9CA3AF' : '#111827'
              }}>
                {config?.label ?? step}
              </div>
              {event?.createdAt && (
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                  {new Date(event.createdAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
              {!event && !isPending && (
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>Completed</div>
              )}
              {isPending && (
                <div style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '1px' }}>Pending</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}