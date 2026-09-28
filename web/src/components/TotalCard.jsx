export default function TotalCard({ value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          background: '#15171C',
          border: '1px solid #2E3038',
          borderRadius: 18,
          padding: '14px 36px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <span style={{ fontSize: 13.5, color: '#8C8F9C', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Total Revenue
        </span>
        <span className="num" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1 }}>{value}</span>
      </div>
    </div>
  )
}
