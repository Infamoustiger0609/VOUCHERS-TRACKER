export default function KpiCard({ dotColor, borderColor, label, value, description, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={disabled ? 'Coming in a later phase' : undefined}
      style={{
        textAlign: 'left',
        background: '#15171C',
        border: `1px solid ${borderColor}`,
        borderRadius: 18,
        padding: '16px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        color: '#ECEBF2',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: dotColor }} />
          <span style={{ fontSize: 13.5, color: '#8C8F9C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5D68" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div className="num" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#6B6E7A' }}>{description}</div>
    </button>
  )
}
