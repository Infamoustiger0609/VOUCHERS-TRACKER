import { useMemo, useState } from 'react'
import Badge from './Badge'
import Modal from './Modal'
import SortControl from './SortControl'
import { categoryStyle } from '../lib/badgeStyles'
import { formatCurrency, formatQty, formatPercent } from '../lib/format'

const TH_STYLE = {
  padding: '11px 14px',
  fontSize: 11,
  color: '#6B6E7A',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: '#15171C',
  zIndex: 1,
}

function ViewChevron() {
  return (
    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
      <span style={{ color: '#5A5D68', display: 'flex', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </td>
  )
}

function StatField({ label, value }) {
  return (
    <div style={{ background: '#131519', border: '1px solid #22242B', borderRadius: 10, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: '#8C8F9C', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
      <div className="num" style={{ fontSize: 15, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}

function monthYear(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', "'")
}

function SchemeDetailModal({ scheme, amountField, amountLabel, onClose }) {
  return (
    <Modal
      open={!!scheme}
      onClose={onClose}
      title={scheme ? `Scheme ${scheme.scheme_code}` : ''}
      subtitle={scheme?.scheme_name}
      width={720}
    >
      {scheme && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatField label="Scheme Code" value={scheme.scheme_code} />
          <StatField label="Vendor" value={scheme.vendor} />
          <StatField label="Category" value={scheme.category} />
          <StatField label="E-Code Nature" value={scheme.e_code_nature || '—'} />
          <StatField label="NO. of E-Code" value={scheme.no_of_e_code != null ? formatQty(scheme.no_of_e_code) : '—'} />
          <StatField label="E-Code Value" value={scheme.e_code_value != null ? `₹${scheme.e_code_value}` : '—'} />
          <StatField label={amountLabel} value={formatCurrency(scheme[amountField])} />
          <StatField label="Created" value={formatQty(scheme.created_qty)} />
          <StatField label="Redeemed" value={formatQty(scheme.redeemed_qty)} />
          <StatField label="% Redeemed" value={formatPercent(scheme.pct_redeemed)} />
          <StatField label="Validity From" value={monthYear(scheme.validity_from)} />
          <StatField label="Validity To" value={monthYear(scheme.validity_to)} />
          <StatField label="Status" value={scheme.status} />
        </div>
      )}
    </Modal>
  )
}

function VendorSummaryModal({ vendor, amountLabel, onClose }) {
  const pct = vendor && vendor.created > 0 ? vendor.redeemed / vendor.created : 0
  return (
    <Modal
      open={!!vendor}
      onClose={onClose}
      title={vendor?.vendor}
      subtitle={vendor ? `Cumulative across all this vendor's schemes` : ''}
      width={560}
    >
      {vendor && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <StatField label="Total Schemes" value={vendor.schemes.length} />
          <StatField label={amountLabel} value={formatCurrency(vendor.amount)} />
          <StatField label="Total Created" value={formatQty(vendor.created)} />
          <StatField label="Total Redeemed" value={formatQty(vendor.redeemed)} />
          <StatField label="Overall % Redeemed" value={formatPercent(pct)} />
        </div>
      )}
    </Modal>
  )
}

function SchemeRow({ scheme, amountField, onOpen, indent = false }) {
  const cat = categoryStyle(scheme.category)

  return (
    <tr
      style={{ borderBottom: '1px solid #1B1D23', cursor: 'pointer' }}
      onClick={() => onOpen(scheme)}
    >
      <td
        className="num"
        style={{
          padding: '12px 14px',
          fontSize: 12.5,
          color: '#D6D5DE',
          textAlign: 'center',
          paddingLeft: indent ? 34 : 14,
        }}
      >
        {scheme.scheme_code}
      </td>
      <td style={{ padding: '12px 14px', fontSize: 12.5, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {scheme.vendor}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <Badge label={scheme.category} bg={cat.bg} color={cat.color} />
      </td>
      <td className="num" style={{ padding: '12px 14px', fontSize: 12.5, textAlign: 'right', color: '#9497A3' }}>
        {formatQty(scheme.created_qty)}
      </td>
      <td className="num" style={{ padding: '12px 14px', fontSize: 12.5, textAlign: 'right', color: '#9497A3' }}>
        {formatQty(scheme.redeemed_qty)}
      </td>
      <td className="num" style={{ padding: '12px 14px', fontSize: 12.5, textAlign: 'right', fontWeight: 600 }}>
        {formatCurrency(scheme[amountField])}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <span className="num" style={{ fontSize: 12.5 }}>{formatPercent(scheme.pct_redeemed)}</span>
      </td>
      <ViewChevron />
    </tr>
  )
}

function VendorRow({ vendor, amountField, onOpenScheme, onOpenVendor, sortField, sortDir }) {
  const [expanded, setExpanded] = useState(false)
  const pct = vendor.created > 0 ? vendor.redeemed / vendor.created : 0
  const sortedSchemes = useMemo(
    () => [...vendor.schemes].sort(makeComparator(sortField, sortDir, { amountField, isVendor: false })),
    [vendor.schemes, sortField, sortDir, amountField],
  )

  return (
    <>
      <tr style={{ borderBottom: '1px solid #1B1D23', background: 'rgba(124,92,252,0.04)' }}>
        <td className="num" style={{ padding: '12px 14px', fontSize: 11.5, color: '#6B6E7A', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{ background: 'transparent', border: 'none', color: '#6B6E7A', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 120ms ease', flexShrink: 0 }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            {vendor.schemes.length} scheme{vendor.schemes.length === 1 ? '' : 's'}
          </button>
        </td>
        <td
          style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', textAlign: 'center' }}
          onClick={() => onOpenVendor(vendor)}
        >
          {vendor.vendor}
        </td>
        <td style={{ padding: '12px 14px', color: '#5A5D68', fontSize: 12, textAlign: 'center' }}>—</td>
        <td className="num" style={{ padding: '12px 14px', fontSize: 12.5, textAlign: 'right', color: '#9497A3' }}>
          {formatQty(vendor.created)}
        </td>
        <td className="num" style={{ padding: '12px 14px', fontSize: 12.5, textAlign: 'right', color: '#9497A3' }}>
          {formatQty(vendor.redeemed)}
        </td>
        <td className="num" style={{ padding: '12px 14px', fontSize: 12.5, textAlign: 'right', fontWeight: 600 }}>
          {formatCurrency(vendor.amount)}
        </td>
        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
          <span className="num" style={{ fontSize: 12.5 }}>{formatPercent(pct)}</span>
        </td>
        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onOpenVendor(vendor)}
            aria-label="View vendor summary"
            style={{ background: 'transparent', border: 'none', color: '#5A5D68', display: 'flex', margin: '0 auto' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </td>
      </tr>
      {expanded &&
        sortedSchemes.map((s, i) => (
          // scheme_code isn't a unique key on its own - a handful of codes
          // are shared by two genuinely distinct sub-offers in the source.
          <SchemeRow key={`${s.scheme_code}-${i}`} scheme={s} amountField={amountField} onOpen={onOpenScheme} indent />
        ))}
    </>
  )
}

function groupByVendor(schemes, amountField) {
  const map = new Map()
  for (const s of schemes) {
    const key = s.vendor || 'Unknown vendor'
    if (!map.has(key)) map.set(key, { vendor: key, schemes: [], created: 0, redeemed: 0, amount: 0, maxValidityFrom: null })
    const g = map.get(key)
    g.schemes.push(s)
    g.created += s.created_qty || 0
    g.redeemed += s.redeemed_qty || 0
    g.amount += s[amountField] || 0
    if (s.validity_from && (!g.maxValidityFrom || s.validity_from > g.maxValidityFrom)) {
      g.maxValidityFrom = s.validity_from
    }
  }
  return Array.from(map.values())
}

/** Builds a comparator over either scheme rows or vendor groups - both
 * expose a revenue amount, a "date" (validity_from), and a redemption
 * rate, just under different field names. */
function makeComparator(field, dir, { amountField, isVendor }) {
  const sign = dir === 'asc' ? 1 : -1
  return (a, b) => {
    let av, bv
    if (field === 'REVENUE') {
      av = isVendor ? a.amount : a[amountField] || 0
      bv = isVendor ? b.amount : b[amountField] || 0
    } else if (field === 'DATE') {
      av = (isVendor ? a.maxValidityFrom : a.validity_from) || ''
      bv = (isVendor ? b.maxValidityFrom : b.validity_from) || ''
    } else {
      // PCT - redemption rate
      av = isVendor ? (a.created > 0 ? a.redeemed / a.created : 0) : a.pct_redeemed || 0
      bv = isVendor ? (b.created > 0 ? b.redeemed / b.created : 0) : b.pct_redeemed || 0
    }
    if (av < bv) return -1 * sign
    if (av > bv) return 1 * sign
    return 0
  }
}

export default function SchemeTable({ schemes, amountField, amountColumnLabel }) {
  const [mode, setMode] = useState('CODE')
  const [modalScheme, setModalScheme] = useState(null)
  const [modalVendor, setModalVendor] = useState(null)
  const [sortField, setSortField] = useState('REVENUE')
  const [sortDir, setSortDir] = useState('desc')

  const sortedSchemes = useMemo(
    () => [...schemes].sort(makeComparator(sortField, sortDir, { amountField, isVendor: false })),
    [schemes, amountField, sortField, sortDir],
  )
  const vendorGroups = useMemo(() => {
    const groups = groupByVendor(schemes, amountField)
    groups.sort(makeComparator(sortField, sortDir, { amountField, isVendor: true }))
    return groups
  }, [schemes, amountField, sortField, sortDir])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', background: '#1B1D23', border: '1px solid #2A2D35', borderRadius: 8, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setMode('CODE')}
            style={{
              padding: '8px 16px',
              fontSize: 12.5,
              background: mode === 'CODE' ? 'rgba(124,92,252,0.16)' : 'transparent',
              border: 'none',
              color: mode === 'CODE' ? '#B7A6FF' : '#9497A3',
            }}
          >
            By Scheme Code
          </button>
          <button
            type="button"
            onClick={() => setMode('VENDOR')}
            style={{
              padding: '8px 16px',
              fontSize: 12.5,
              background: mode === 'VENDOR' ? 'rgba(124,92,252,0.16)' : 'transparent',
              border: 'none',
              borderLeft: '1px solid #2A2D35',
              color: mode === 'VENDOR' ? '#B7A6FF' : '#9497A3',
            }}
          >
            By Vendor
          </button>
        </div>
        <div style={{ flexGrow: 1 }} />
        <SortControl
          field={sortField}
          dir={sortDir}
          amountLabel={amountColumnLabel}
          onChange={(f, d) => {
            setSortField(f)
            setSortDir(d)
          }}
        />
      </div>

      <div style={{ background: '#15171C', border: '1px solid #22242B', borderRadius: 14, overflow: 'auto', flexGrow: 1, minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #22242B' }}>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>{mode === 'CODE' ? 'Scheme Code' : 'Schemes'}</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Vendor</th>
              <th style={{ ...TH_STYLE, textAlign: 'center' }}>Category</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Created</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Redeemed</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>{amountColumnLabel}</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>% Redeemed</th>
              <th style={{ ...TH_STYLE, width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {mode === 'CODE'
              ? sortedSchemes.map((s, i) => (
                  // scheme_code isn't a unique key on its own - a handful
                  // of codes are shared by two genuinely distinct
                  // sub-offers in the source (see dataquality_log.json).
                  <SchemeRow key={`${s.scheme_code}-${i}`} scheme={s} amountField={amountField} onOpen={setModalScheme} />
                ))
              : vendorGroups.map((g) => (
                  <VendorRow
                    key={g.vendor}
                    vendor={g}
                    amountField={amountField}
                    onOpenScheme={setModalScheme}
                    onOpenVendor={setModalVendor}
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                ))}
            {schemes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: '#6B6E7A', fontSize: 13 }}>
                  No schemes match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SchemeDetailModal
        scheme={modalScheme}
        amountField={amountField}
        amountLabel={amountColumnLabel}
        onClose={() => setModalScheme(null)}
      />
      <VendorSummaryModal vendor={modalVendor} amountLabel={amountColumnLabel} onClose={() => setModalVendor(null)} />
    </div>
  )
}
