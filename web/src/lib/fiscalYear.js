// Indian fiscal year: April -> March. "2026-27" spans 2026-04-01..2027-03-31.

export function fyLabelFromDate(date) {
  if (!date) return null
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const startYear = month >= 4 ? year : year - 1
  const endYear = startYear + 1
  return `${startYear}-${String(endYear).slice(-2)}`
}

export function fyLabelFromDateString(str) {
  if (!str) return null
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return null
  return fyLabelFromDate(d)
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthNameFromDateString(str) {
  if (!str) return null
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return null
  return MONTH_NAMES[d.getMonth()]
}
