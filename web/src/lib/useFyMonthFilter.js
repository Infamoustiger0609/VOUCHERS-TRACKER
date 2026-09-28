import { useCallback, useEffect, useMemo } from 'react'
import { fyLabelFromDateString, monthNameFromDateString, MONTH_NAMES } from './fiscalYear'
import { useSharedFySelection } from './FilterContext'

function monthKeyFromDateString(str) {
  // "2024-06-10" -> "2024-06"
  if (!str) return null
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fyLabelFromMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  return fyLabelFromDateString(new Date(y, m - 1, 1).toISOString())
}

function monthNameFromMonthKey(key) {
  const [, m] = key.split('-').map(Number)
  return MONTH_NAMES[m - 1]
}

/**
 * Shared FY/Month multi-select filter logic - used by Overview and every
 * bucket detail page so "dynamic month options per selected FY" and
 * "reference date = latest real month in scope" behave identically
 * everywhere.
 */
export function useFyMonthFilter(schemes) {
  // Shared across Overview + every bucket detail page (see FilterContext) -
  // only the derived options/matcher below are page-local, computed from
  // this page's own `schemes` slice.
  const { fySelected, setFySelected, monthSelected, setMonthSelected } = useSharedFySelection()

  const fyOptions = useMemo(() => {
    const labels = new Set()
    for (const s of schemes) {
      const label = fyLabelFromDateString(s.validity_from)
      if (label) labels.add(label)
    }
    return Array.from(labels).sort().reverse().map((l) => ({ value: l, label: l }))
  }, [schemes])

  // Every calendar month actually present in the data (from Validity From),
  // sorted ascending.
  const allMonthKeys = useMemo(() => {
    const keys = new Set()
    for (const s of schemes) {
      const key = monthKeyFromDateString(s.validity_from)
      if (key) keys.add(key)
    }
    return Array.from(keys).sort()
  }, [schemes])

  // Month dropdown only offers months with real data in the currently
  // selected FY(s).
  const monthOptions = useMemo(() => {
    const names = new Set()
    for (const key of allMonthKeys) {
      if (fySelected.length > 0 && !fySelected.includes(fyLabelFromMonthKey(key))) continue
      names.add(monthNameFromMonthKey(key))
    }
    return MONTH_NAMES.filter((m) => names.has(m)).map((m) => ({ value: m, label: m }))
  }, [allMonthKeys, fySelected])

  // If the FY selection changes and a previously-selected month is no
  // longer offered, drop it rather than silently filtering everything out.
  useEffect(() => {
    setMonthSelected((prev) => {
      if (prev.length === 0) return prev
      const validValues = new Set(monthOptions.map((o) => o.value))
      const next = prev.filter((m) => validValues.has(m))
      return next.length === prev.length ? prev : next
    })
  }, [monthOptions])

  const matches = useCallback(
    (s) => {
      if (fySelected.length > 0 && !fySelected.includes(fyLabelFromDateString(s.validity_from))) return false
      if (monthSelected.length > 0 && !monthSelected.includes(monthNameFromDateString(s.validity_from))) return false
      return true
    },
    [fySelected, monthSelected],
  )

  // The latest month-end actually covered by the current FY/Month
  // selection - e.g. FY26-27 + Month "All" -> end of the latest month with
  // real data in that FY. With no filter at all, use today's real date.
  const referenceDate = useMemo(() => {
    if (fySelected.length === 0 && monthSelected.length === 0) {
      return new Date()
    }
    const resolved = allMonthKeys.filter((key) => {
      const fyOk = fySelected.length === 0 || fySelected.includes(fyLabelFromMonthKey(key))
      const monthOk = monthSelected.length === 0 || monthSelected.includes(monthNameFromMonthKey(key))
      return fyOk && monthOk
    })
    if (resolved.length === 0) return new Date()
    const [y, m] = resolved[resolved.length - 1].split('-').map(Number)
    return new Date(y, m, 0, 23, 59, 59, 999) // last day of month m (1-based), end of day
  }, [allMonthKeys, fySelected, monthSelected])

  return {
    fySelected,
    setFySelected,
    monthSelected,
    setMonthSelected,
    fyOptions,
    monthOptions,
    matches,
    referenceDate,
  }
}
