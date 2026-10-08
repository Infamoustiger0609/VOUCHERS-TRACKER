import { useCallback, useEffect, useMemo } from 'react'
import {
  fyLabelFromDateString,
  fyLabelFromMonthKey,
  monthKeyFromDateString,
  monthNameFromMonthKey,
  shortMonthLabelFromMonthKey,
} from './fiscalYear'
import { useSharedFySelection } from './FilterContext'
import { isNone, pruneSelection, selectionMatches } from './multiSelect'

/**
 * Shared FY/Month multi-select filter logic - used by Overview and every
 * bucket detail page so option lists, matching and pruning behave
 * identically everywhere.
 *
 * Pass the FULL scheme list (not a page's bucket slice): the selection is
 * shared across pages, so "All", "all but one" and "every option ticked"
 * must mean the same set of FYs/months on every page.
 *
 * Month values are "YYYY-MM" keys, so June 2024 and June 2025 are distinct.
 */
export function useFyMonthFilter(schemes) {
  const { fySelected, setFySelected, monthSelected, setMonthSelected } = useSharedFySelection()

  const fyOptions = useMemo(() => {
    const labels = new Set()
    for (const s of schemes) {
      const label = fyLabelFromDateString(s.validity_from)
      if (label) labels.add(label)
    }
    return Array.from(labels).sort().reverse().map((l) => ({ value: l, label: l }))
  }, [schemes])

  // Every calendar month actually present in the data, chronological -
  // which within one FY is exactly April -> March order.
  const allMonthKeys = useMemo(() => {
    const keys = new Set()
    for (const s of schemes) {
      const key = monthKeyFromDateString(s.validity_from)
      if (key) keys.add(key)
    }
    return Array.from(keys).sort()
  }, [schemes])

  // Only months with data in the selected FY(s). One FY in scope -> plain
  // month names; several -> year-qualified ("Jun '24") so they're
  // distinguishable.
  const monthOptions = useMemo(() => {
    const keys = allMonthKeys.filter((key) => selectionMatches(fySelected, fyLabelFromMonthKey(key)))
    const singleFy = new Set(keys.map(fyLabelFromMonthKey)).size === 1
    return keys.map((key) => ({
      value: key,
      label: singleFy ? monthNameFromMonthKey(key) : shortMonthLabelFromMonthKey(key),
    }))
  }, [allMonthKeys, fySelected])

  // When the FY selection changes, drop months that are no longer offered.
  // Skipped until data has loaded - otherwise the empty first render on
  // every page mount would wipe the shared month selection - and while FY
  // is None, the transient state on the way from "All" to a few FYs, which
  // offers no months but already matches zero rows.
  useEffect(() => {
    if (schemes.length === 0 || isNone(fySelected)) return
    const valid = monthOptions.map((o) => o.value)
    setMonthSelected((prev) => pruneSelection(prev, valid))
  }, [schemes, fySelected, monthOptions, setMonthSelected])

  const matches = useCallback(
    (s) =>
      selectionMatches(fySelected, fyLabelFromDateString(s.validity_from)) &&
      selectionMatches(monthSelected, monthKeyFromDateString(s.validity_from)),
    [fySelected, monthSelected],
  )

  // The latest month-end actually covered by the current FY/Month
  // selection - e.g. FY 2026-27 + Month "All" -> end of the latest month
  // with real data in that FY. With no filter at all, use today's date.
  const referenceDate = useMemo(() => {
    if (fySelected.length === 0 && monthSelected.length === 0) return new Date()
    if (isNone(fySelected) || isNone(monthSelected)) return new Date()
    const resolved = allMonthKeys.filter(
      (key) => selectionMatches(fySelected, fyLabelFromMonthKey(key)) && selectionMatches(monthSelected, key),
    )
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
