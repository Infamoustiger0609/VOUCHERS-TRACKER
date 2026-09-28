export default function Badge({ label, bg, color, size = 11 }) {
  return (
    <span
      style={{
        fontSize: size,
        padding: '3px 9px',
        borderRadius: 20,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
