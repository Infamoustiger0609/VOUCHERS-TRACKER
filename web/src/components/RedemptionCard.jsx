// Shared by SecondaryStrip (per-bucket, top row) and CategoryStrip
// (per-category, bottom row) on Overview. `revenueLabel` is optional -
// when omitted (top row), the card is exactly the original single-metric
// layout; when provided (bottom row), Revenue sits alongside Redeemed/
// Created within the SAME card height, not a taller box.
export default function RedemptionCard({ label, dotColor, redeemedLabel, createdLabel, pctLabel, revenueLabel }) {
  const hasRevenue = revenueLabel != null

  return (
    <div
      className="eh-card"
      style={{
        padding: '13px 16px',
        height: 88,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 5,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: dotColor, flexShrink: 0 }} />
        <span
          style={{
            fontSize: hasRevenue ? 13.5 : 12.5,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
      </div>

      {!hasRevenue ? (
        <>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Redeemed / Created
          </div>
          <div
            className="num"
            style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', color: 'var(--text-primary)' }}
          >
            <span>{redeemedLabel}</span>
            <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>{' / '}{createdLabel}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{' · '}{pctLabel}</span>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, minWidth: 0 }}>
          <div style={{ minWidth: 0, flexShrink: 1 }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              Redeemed / Created
            </div>
            <div
              className="num"
              style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', color: 'var(--text-primary)' }}
            >
              <span>{redeemedLabel}</span>
              <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>{' / '}{createdLabel}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{' · '}{pctLabel}</span>
            </div>
          </div>

          <div style={{ minWidth: 0, flexShrink: 0 }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              Revenue
            </div>
            <div
              className="num"
              style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', color: 'var(--text-primary)' }}
            >
              {revenueLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
