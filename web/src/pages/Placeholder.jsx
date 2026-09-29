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
        color: 'var(--text-muted)',
      }}
    >
      <div className="disp" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: 13 }}>Coming in a later phase.</div>
    </main>
  )
}
