import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilterBar from '../components/FilterBar'
import KpiCard from '../components/KpiCard'
import FlowDiagram from '../components/FlowDiagram'
import TotalCard from '../components/TotalCard'
import SecondaryStrip from '../components/SecondaryStrip'
import CategoryStrip from '../components/CategoryStrip'
import { useDashboardData } from '../lib/useDashboardData'
import { useFyMonthFilter } from '../lib/useFyMonthFilter'
import { formatCurrency, formatQty, formatPercent } from '../lib/format'

function redemptionRatio(schemesForBucket) {
  let redeemed = 0
  let created = 0
  let revenue = 0
  for (const s of schemesForBucket) {
    redeemed += s.redeemed_qty || 0
    created += s.created_qty || 0
    // recognized_amount is the same field used everywhere else on the
    // dashboard for "Revenue" (NEFT = upfront Total; Kotak/Offers = actual
    // redemption_amount).
    revenue += s.recognized_amount || 0
  }
  const pct = created > 0 ? redeemed / created : 0
  return {
    redeemedLabel: formatQty(redeemed),
    createdLabel: formatQty(created),
    pctLabel: formatPercent(pct),
    revenueLabel: formatCurrency(revenue),
  }
}

export default function Overview() {
  const navigate = useNavigate()
  const { schemes, monthly, loading, error } = useDashboardData()
  const [paymentGroup, setPaymentGroup] = useState('ALL')

  // Full FY24-27 monthly trend per bucket, independent of the FY/Month
  // filter above - the sparklines always show the whole history.
  const sparklines = useMemo(
    () => ({
      neft: monthly.map((m) => m.neft),
      kotak: monthly.map((m) => m.kotak),
      offers: monthly.map((m) => m.offers),
    }),
    [monthly],
  )

  const { fySelected, setFySelected, monthSelected, setMonthSelected, fyOptions, monthOptions, matches } =
    useFyMonthFilter(schemes)

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      if (!matches(s)) return false
      if (paymentGroup === 'NEFT' && s.bucket !== 'NEFT') return false
      if (paymentGroup === 'ON_REDEMPTION' && s.bucket !== 'OFFERS' && s.bucket !== 'KOTAK') return false
      return true
    })
  }, [schemes, matches, paymentGroup])

  const kpis = useMemo(() => {
    let neft = 0
    let kotak = 0
    let offers = 0
    for (const s of filteredSchemes) {
      // NEFT is recognized upfront (E-Codes' own Total), independent of
      // redemption pace. Kotak/Offers are already redemption-based, so
      // recognized_amount === redemption_amount for those.
      if (s.bucket === 'NEFT') neft += s.recognized_amount || 0
      else if (s.bucket === 'KOTAK') kotak += s.redemption_amount || 0
      else if (s.bucket === 'OFFERS') offers += s.redemption_amount || 0
    }
    // Total is the sum of the three KPI cards as displayed - a deliberate
    // mix of recognized (NEFT) and actual redemption (Kotak/Offers), not a
    // pure "total redeemed" figure.
    return { neft, kotak, offers, total: neft + kotak + offers }
  }, [filteredSchemes])

  const redemptionStats = useMemo(() => {
    return {
      NEFT: redemptionRatio(filteredSchemes.filter((s) => s.bucket === 'NEFT')),
      KOTAK: redemptionRatio(filteredSchemes.filter((s) => s.bucket === 'KOTAK')),
      OFFERS: redemptionRatio(filteredSchemes.filter((s) => s.bucket === 'OFFERS')),
      OVERALL: redemptionRatio(filteredSchemes),
    }
  }, [filteredSchemes])

  const categoryStats = useMemo(() => {
    return {
      'F&B': redemptionRatio(filteredSchemes.filter((s) => s.category === 'F&B')),
      Ticket: redemptionRatio(filteredSchemes.filter((s) => s.category === 'Ticket')),
      'Ticket & F&B': redemptionRatio(filteredSchemes.filter((s) => s.category === 'Ticket & F&B')),
    }
  }, [filteredSchemes])

  if (loading) {
    return (
      <main style={mainStyle}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Loading dashboard data...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main style={mainStyle}>
        <div style={{ color: 'var(--warning)', fontSize: 13.5 }}>
          Couldn't load dashboard data. Run <code>npm run sync-data</code> after the pipeline has produced /data, then reload.
        </div>
      </main>
    )
  }

  return (
    <main style={mainStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="disp" style={{ margin: 0, fontSize: 32, fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>Overview</h1>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 1 }}>E-Voucher Tracker</div>
        </div>
      </div>

      <FilterBar
        fySelected={fySelected}
        fyOptions={fyOptions}
        onFyChange={setFySelected}
        monthSelected={monthSelected}
        monthOptions={monthOptions}
        onMonthChange={setMonthSelected}
        paymentGroup={paymentGroup}
        onPaymentGroupChange={setPaymentGroup}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <KpiCard
          dotColor="var(--kpi-corporate-sales)"
          borderColor="var(--border-light)"
          label="Corp. Sales Revenue"
          value={formatCurrency(kpis.neft)}
          description="Upfront-recognized"
          sparkline={sparklines.neft}
          onClick={() => navigate('/corporate-sales')}
        />
        <KpiCard
          dotColor="var(--kpi-kotak)"
          borderColor="var(--border-light)"
          label="Kotak Revenue"
          value={formatCurrency(kpis.kotak)}
          description="All Kotak schemes · any payment mode"
          sparkline={sparklines.kotak}
          onClick={() => navigate('/kotak')}
        />
        <KpiCard
          dotColor="var(--kpi-offers)"
          borderColor="var(--border-light)"
          label="Offers Revenue"
          value={formatCurrency(kpis.offers)}
          description="On Redemption"
          sparkline={sparklines.offers}
          onClick={() => navigate('/offers')}
        />
      </div>

      <FlowDiagram />
      <TotalCard value={formatCurrency(kpis.total)} />

      <SecondaryStrip stats={redemptionStats} />
      <CategoryStrip stats={categoryStats} />
    </main>
  )
}

const mainStyle = {
  flexGrow: 1,
  padding: '14px 32px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  // `gap` is a floor, not the final spacing - space-between hands any
  // leftover vertical room to the gaps themselves, so the page always
  // tucks fully to the bottom instead of dumping unused space as a dead
  // zone under the last row. On a viewport tall enough that no room is
  // left over, this collapses back to the plain `gap` value.
  justifyContent: 'space-between',
  minWidth: 0,
  height: '100%',
  // Zero-scroll is the goal on a normal full-HD+ screen, but this is a
  // fallback, not a hard rule: if real browser chrome leaves less height
  // than the content needs, this area scrolls internally rather than
  // silently clipping the bottom of the page (which `overflow: hidden`
  // would do).
  overflowY: 'auto',
}
