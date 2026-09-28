import RedemptionCard from './RedemptionCard'

const CARDS = [
  { key: 'F&B', label: 'F&B', dotColor: '#5EE0AE' },
  { key: 'Ticket', label: 'Tickets', dotColor: '#7FD4FF' },
  { key: 'Ticket & F&B', label: 'Both', dotColor: '#B7A6FF' },
]

export default function CategoryStrip({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
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
            revenueLabel={s.revenueLabel}
          />
        )
      })}
    </div>
  )
}
