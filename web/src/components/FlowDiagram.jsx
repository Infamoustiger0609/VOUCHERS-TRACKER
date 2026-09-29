// Three lines from the Corporate Sales/Kotak/Offers KPI cards converging
// into the Total Revenue card below. viewBox coordinates assume the three cards
// sit in equal thirds above (x=200/600/1000 of a 1200-wide reference),
// stretched to the real container width via preserveAspectRatio="none".
export default function FlowDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="100%" height="26" viewBox="0 0 1200 84" preserveAspectRatio="none" style={{ overflow: 'visible', display: 'block' }}>
        <path d="M 200 0 L 200 34 Q 200 50 216 50 L 584 50 Q 600 50 600 66 L 600 78" stroke="var(--flow-line)" strokeWidth="2" fill="none" />
        <path d="M 600 0 L 600 78" stroke="var(--flow-line)" strokeWidth="2" fill="none" />
        <path d="M 1000 0 L 1000 34 Q 1000 50 984 50 L 616 50 Q 600 50 600 66 L 600 78" stroke="var(--flow-line)" strokeWidth="2" fill="none" />
        <path d="M 592 71 L 600 80 L 608 71" stroke="var(--flow-line)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
