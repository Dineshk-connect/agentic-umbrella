const variants = {
  primary:   { background: '#1A56DB', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#374151', border: '0.5px solid #D1D5DB' },
  success:   { background: '#059669', color: '#fff', border: 'none' },
  danger:    { background: '#fff', color: '#DC2626', border: '0.5px solid #FECACA' },
  ghost:     { background: 'transparent', color: '#6B7280', border: 'none' },
  purple:    { background: '#7C3AED', color: '#fff', border: 'none' },
  teal:      { background: '#0F766E', color: '#fff', border: 'none' },
}

export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, style }) {
  const v = variants[variant] ?? variants.primary
  const padding = size === 'sm' ? '5px 12px' : size === 'lg' ? '10px 20px' : '7px 16px'
  const fontSize = size === 'sm' ? '12px' : '13px'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v,
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: '7px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        ...style
      }}
    >
      {children}
    </button>
  )
}