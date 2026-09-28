// Shared number formatting for the whole dashboard - every page reuses these,
// not just Overview. Everything rounds to whole numbers, no decimals,
// anywhere (Lakh/K values, percentages, counts).

const LAKH = 100000
const THOUSAND = 1000
// Non-breaking space between a number and its unit so "5 L" never wraps
// onto two lines when a card gets tight on width.
const NBSP = ' '

function withSign(value, body) {
  return value < 0 ? `-${body}` : body
}

/** Currency in rupees -> "₹X L" (>= ₹1,00,000) or "₹X K" (below), rounded. */
export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '₹0'
  const abs = Math.abs(value)

  if (abs >= LAKH) {
    const lakhs = Math.round(abs / LAKH).toLocaleString('en-IN')
    return withSign(value, `₹${lakhs}${NBSP}L`)
  }

  const k = Math.round(abs / THOUSAND)
  return withSign(value, `₹${k.toLocaleString('en-IN')}${NBSP}K`)
}

/** Plain quantity -> as-is (< 1,000), "X K" (>= 1,000), "X L" (>= 1,00,000), rounded. */
export function formatQty(value) {
  if (value == null || Number.isNaN(value)) return '0'
  const abs = Math.abs(value)

  if (abs >= LAKH) {
    const lakhs = Math.round(abs / LAKH).toLocaleString('en-IN')
    return withSign(value, `${lakhs}${NBSP}L`)
  }
  if (abs >= THOUSAND) {
    const k = Math.round(abs / THOUSAND).toLocaleString('en-IN')
    return withSign(value, `${k}${NBSP}K`)
  }
  return withSign(value, Math.round(abs).toLocaleString('en-IN'))
}

/** Ratio (0..1) -> "67%", rounded. */
export function formatPercent(ratio) {
  if (ratio == null || Number.isNaN(ratio)) return '0%'
  return `${Math.round(ratio * 100)}%`
}
