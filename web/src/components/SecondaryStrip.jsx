import RedemptionCard from './RedemptionCard'

const CARDS = [
  { key: 'NEFT', label: 'Corporate Sales', dotColor: '#5CC8FC' },
  { key: 'KOTAK', label: 'Kotak', dotColor: '#F2B84B' },
  { key: 'OFFERS', label: 'Offers', dotColor: '#7C5CFC' },
  { key: 'OVERALL', label: 'Overall', dotColor: '#34D399' },
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
