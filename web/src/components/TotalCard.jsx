export default function TotalCard({ value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          background: 'var(--total-card-bg)',
          border: '1px solid var(--total-card-border)',
          borderRadius: 18,
          padding: '12px 34px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Total Revenue
        </span>
        <span className="num" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: 'var(--text-primary)' }}>{value}</span>
      </div>
    </div>
  )
}
