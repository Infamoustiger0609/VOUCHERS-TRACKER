function MiniKpi({ label, value, accent }) {
  return (
    <div
      className="eh-card"
      style={{
        border: `1px solid ${accent ? 'var(--border-medium)' : 'var(--border-light)'}`,
        borderRadius: 10,
        padding: '10px 16px',
        minWidth: 130,
      }}
    >
      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
      <div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

export default function MiniKpiStrip({ items }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {items.map((item, i) => (
        <MiniKpi key={item.label} label={item.label} value={item.value} accent={i === 0} />
      ))}
    </div>
  )
}
