import Sparkline from './Sparkline'

export default function KpiCard({ dotColor, borderColor, label, value, description, sparkline, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="eh-card"
      onClick={onClick}
      title={disabled ? 'Coming in a later phase' : undefined}
      style={{
        textAlign: 'left',
        border: `1px solid ${borderColor}`,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        color: 'var(--text-primary)',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkline data={sparkline} color={dotColor} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
      <div className="num" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{description}</div>
    </button>
  )
}
