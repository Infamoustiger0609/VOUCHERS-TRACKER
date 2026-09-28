// Shared by SecondaryStrip (per-bucket, top row) and CategoryStrip
// (per-category, bottom row) on Overview. `revenueLabel` is optional -
// when omitted (top row), the card is exactly the original single-metric
// layout; when provided (bottom row), Revenue sits alongside Redeemed/
// Created within the SAME card height, not a taller box.
export default function RedemptionCard({ label, dotColor, redeemedLabel, createdLabel, pctLabel, revenueLabel }) {
  const hasRevenue = revenueLabel != null

  return (
    <div
      style={{
        background: '#15171C',
        border: '1px solid #22242B',
        borderRadius: 18,
        padding: '14px 16px',
        height: 92,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: dotColor, flexShrink: 0 }} />
        <span
          style={{
            fontSize: hasRevenue ? 13.5 : 12.5,
            color: '#8C8F9C',
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
          <div style={{ fontSize: 10.5, color: '#6B6E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Redeemed / Created
          </div>
          <div
            className="num"
            style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden' }}
          >
            <span>{redeemedLabel}</span>
            <span style={{ color: '#5A5D68', fontWeight: 400 }}>{' / '}{createdLabel}</span>
            <span style={{ color: '#6B6E7A', fontWeight: 400 }}>{' · '}{pctLabel}</span>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, minWidth: 0 }}>
          <div style={{ minWidth: 0, flexShrink: 1 }}>
            <div style={{ fontSize: 9.5, color: '#6B6E7A', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              Redeemed / Created
            </div>
            <div
              className="num"
              style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden' }}
            >
              <span>{redeemedLabel}</span>
              <span style={{ color: '#5A5D68', fontWeight: 400 }}>{' / '}{createdLabel}</span>
              <span style={{ color: '#6B6E7A', fontWeight: 400 }}>{' · '}{pctLabel}</span>
            </div>
          </div>

          <div style={{ minWidth: 0, flexShrink: 0 }}>
            <div style={{ fontSize: 9.5, color: '#6B6E7A', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              Revenue
            </div>
            <div
              className="num"
              style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden' }}
            >
              {revenueLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
