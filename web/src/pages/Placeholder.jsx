export default function Placeholder({ title }) {
  return (
    <main
      style={{
        flexGrow: 1,
        padding: '30px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: '100%',
        overflowY: 'auto',
        color: '#6B6E7A',
      }}
    >
      <div className="disp" style={{ fontSize: 20, color: '#8C8F9C' }}>{title}</div>
      <div style={{ fontSize: 13 }}>Coming in a later phase.</div>
    </main>
  )
}
