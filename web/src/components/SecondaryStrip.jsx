import RedemptionCard from './RedemptionCard'

const CARDS = [
  { key: 'NEFT', label: 'Corporate Sales', dotColor: 'var(--kpi-corporate-sales)' },
  { key: 'KOTAK', label: 'Kotak', dotColor: 'var(--kpi-kotak)' },
  { key: 'OFFERS', label: 'Offers', dotColor: 'var(--kpi-offers)' },
  { key: 'OVERALL', label: 'Overall', dotColor: 'var(--kpi-overall)' },
]

export default function SecondaryStrip({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {CARDS.map((c) => {
        const s = stats[c.key]
        return (
          <RedemptionCard
            key={c.key}
            label={c.label}
            dotColor={c.dotColor}
            redeemedLabel={s.redeemedLabel}
            createdLabel={s.createdLabel}
            pctLabel={s.pctLabel}
          />
        )
      })}
    </div>
  )
}
