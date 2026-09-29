import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FilterBar from '../components/FilterBar'
import MiniKpiStrip from '../components/MiniKpiStrip'
import SchemeTable from '../components/SchemeTable'
import SearchBox from '../components/SearchBox'
import { useDashboardData } from '../lib/useDashboardData'
import { useFyMonthFilter } from '../lib/useFyMonthFilter'
import { formatCurrency, formatQty, formatPercent } from '../lib/format'

const AMOUNT_FIELD = 'recognized_amount'
const AMOUNT_COLUMN_LABEL = 'Revenue'

/**
 * Shared shell for every bucket detail page (Corporate Sales/Kotak/Offers).
 * Only the bucket filter and the breadcrumb/title text differ between
 * buckets - everything else (KPI strip, filters, table, both modals) is
 * identical, so it lives here once instead of being copy-pasted per page.
 */
export default function BucketDetailPage({ bucket, breadcrumbLabel, pageTitle }) {
  const { schemes, loading, error } = useDashboardData()
  const bucketSchemes = useMemo(() => schemes.filter((s) => s.bucket === bucket), [schemes, bucket])

  const { fySelected, setFySelected, monthSelected, setMonthSelected, fyOptions, monthOptions, matches } =
    useFyMonthFilter(bucketSchemes)

  const filteredSchemes = useMemo(() => bucketSchemes.filter(matches), [bucketSchemes, matches])

  const [search, setSearch] = useState('')
  const searchedSchemes = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return filteredSchemes
    return filteredSchemes.filter((s) => {
      return (
        String(s.scheme_code).toLowerCase().includes(term) ||
        (s.vendor || '').toLowerCase().includes(term) ||
        (s.scheme_name || '').toLowerCase().includes(term)
      )
    })
  }, [filteredSchemes, search])

  const kpis = useMemo(() => {
    let recognized = 0
    let redeemed = 0
    let created = 0
    for (const s of filteredSchemes) {
      recognized += s[AMOUNT_FIELD] || 0
      redeemed += s.redeemed_qty || 0
      created += s.created_qty || 0
    }
    return { recognized, redeemed, created, pct: created > 0 ? redeemed / created : 0 }
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Overview</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{breadcrumbLabel}</span>
          </div>
          <h1 className="disp" style={{ margin: '4px 0 0 0', fontSize: 42, fontWeight: 700, lineHeight: 1.1, color: 'var(--text-primary)' }}>
            {pageTitle}
          </h1>
        </div>

        <MiniKpiStrip
          items={[
            { label: 'Revenue', value: formatCurrency(kpis.recognized) },
            { label: 'Redeemed / Created', value: `${formatQty(kpis.redeemed)} / ${formatQty(kpis.created)}` },
            { label: 'Redemption %', value: formatPercent(kpis.pct) },
          ]}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <FilterBar
            fySelected={fySelected}
            fyOptions={fyOptions}
            onFyChange={setFySelected}
            monthSelected={monthSelected}
            monthOptions={monthOptions}
            onMonthChange={setMonthSelected}
            showPaymentMode={false}
          />
        </div>
        <SearchBox value={search} onChange={setSearch} />
      </div>

      <SchemeTable schemes={searchedSchemes} amountField={AMOUNT_FIELD} amountColumnLabel={AMOUNT_COLUMN_LABEL} />
    </main>
  )
}

const mainStyle = {
  flexGrow: 1,
  padding: '16px 36px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minWidth: 0,
  height: '100%',
  overflowY: 'auto',
}
