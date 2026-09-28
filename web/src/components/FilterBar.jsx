import MultiSelectDropdown from './MultiSelectDropdown'

const SEGMENTS = [
  { key: 'ALL', label: 'All' },
  { key: 'NEFT', label: 'NEFT group' },
  { key: 'ON_REDEMPTION', label: 'On Redemption group' },
]

export default function FilterBar({
  fySelected,
  fyOptions,
  onFyChange,
  monthSelected,
  monthOptions,
  onMonthChange,
  paymentGroup,
  onPaymentGroupChange,
  showPaymentMode = true,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: '#131519',
        border: '1px solid #22242B',
        borderRadius: 10,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 11, color: '#6B6E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: 4 }}>
        Filters
      </span>

      <MultiSelectDropdown label="FY" options={fyOptions} selected={fySelected} onChange={onFyChange} />
      <MultiSelectDropdown label="Month" options={monthOptions} selected={monthSelected} onChange={onMonthChange} />

      {showPaymentMode && (
        <>
          <div style={{ width: 1, height: 20, background: '#2A2D35', margin: '0 4px' }} />

          <span style={{ fontSize: 11.5, color: '#6B6E7A' }}>Payment Mode:</span>
          <div style={{ display: 'flex', background: '#1B1D23', border: '1px solid #2A2D35', borderRadius: 8, overflow: 'hidden' }}>
            {SEGMENTS.map((seg, i) => {
              const active = paymentGroup === seg.key
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => onPaymentGroupChange(seg.key)}
                  style={{
                    padding: '7px 13px',
                    fontSize: 12.5,
                    background: active ? 'rgba(92,200,252,0.16)' : 'transparent',
                    border: 'none',
                    borderLeft: i > 0 ? '1px solid #2A2D35' : 'none',
                    color: active ? '#7FD4FF' : '#9497A3',
                  }}
                >
                  {seg.label}
                </button>
              )
            })}
          </div>

          <span
            aria-label="Payment mode group info"
            title="NEFT group = Upfront-recognized schemes. On Redemption group = Kotak + Offers combined."
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#1B1D23',
              border: '1px solid #2A2D35',
              color: '#6B6E7A',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'help',
            }}
          >
            i
          </span>
        </>
      )}
    </div>
  )
}
