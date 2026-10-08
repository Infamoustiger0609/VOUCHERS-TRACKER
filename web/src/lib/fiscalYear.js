// Indian fiscal year: April -> March, labelled by start and end year.
// "2024-25" spans 2024-04-01..2025-03-31. Every FY/month derivation in the
// app goes through these helpers, always from `validity_from` (the same
// field the pipeline recognizes revenue on).
//
// Dates are read straight off the pipeline's "YYYY-MM-DD" strings rather
// than via `new Date()`, so the browser's timezone can never shift a
// 1st-of-month or 31st-of-March scheme into the neighbouring month/FY.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2024-06-10" -> "2024-06" (null if not a YYYY-MM-DD string). */
export function monthKeyFromDateString(str) {
  const m = typeof str === 'string' ? /^(\d{4})-(\d{2})/.exec(str) : null
  return m ? `${m[1]}-${m[2]}` : null
}

/** "2025-03" -> "2024-25", "2025-04" -> "2025-26". */
export function fyLabelFromMonthKey(key) {
  if (!key) return null
  const [y, m] = key.split('-').map(Number)
  const startYear = m >= 4 ? y : y - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

/** "2025-03-31" -> "2024-25". */
export function fyLabelFromDateString(str) {
  return fyLabelFromMonthKey(monthKeyFromDateString(str))
}

/** "2024-06" -> "June". */
export function monthNameFromMonthKey(key) {
  return MONTH_NAMES[Number(key.split('-')[1]) - 1]
}

/** "2024-06" -> "Jun '24". */
export function shortMonthLabelFromMonthKey(key) {
  const [y] = key.split('-')
  return `${monthNameFromMonthKey(key).slice(0, 3)} '${y.slice(-2)}`
}
