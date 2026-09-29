import RedemptionCard from './RedemptionCard'

const CARDS = [
  { key: 'F&B', label: 'F&B', dotColor: 'var(--success)' },
  { key: 'Ticket', label: 'Tickets', dotColor: 'var(--kpi-corporate-sales)' },
  { key: 'Ticket & F&B', label: 'Both', dotColor: 'var(--kpi-offers)' },
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
