// Selection model shared by every multi-select filter (FY, Month):
//   []             -> unrestricted ("All", every option ticked)
//   [a, b, ...]    -> exactly those values
//   NONE_SELECTED  -> nothing ticked; matches zero rows
// Pure functions only - MultiSelectDropdown and useFyMonthFilter both go
// through these so the rules can't drift between the control and the
// filtering.

export const NONE_SELECTED = 'NONE_SELECTED'

export function isNone(selected) {
  return selected === NONE_SELECTED
}

/** True for [] or an explicit array that covers every option. */
export function isAll(selected, allValues) {
  if (isNone(selected)) return false
  if (selected.length === 0) return true
  return allValues.length > 0 && allValues.every((v) => selected.includes(v))
}

/** Does a row whose filter value is `value` pass this selection? */
export function selectionMatches(selected, value) {
  if (isNone(selected)) return false
  if (selected.length === 0) return true
  return selected.includes(value)
}

/** Is this option's checkbox ticked? */
export function isChecked(selected, value) {
  return selectionMatches(selected, value)
}

/** Collapse an explicit array to [] / NONE_SELECTED where it means that. */
function normalize(next, allValues) {
  if (next.length === 0) return NONE_SELECTED
  if (allValues.length > 0 && allValues.every((v) => next.includes(v))) return []
  return next
}

/** Tap on one option row. */
export function toggleOption(selected, value, allValues) {
  if (isNone(selected)) return normalize([value], allValues)
  if (selected.length === 0) return normalize(allValues.filter((v) => v !== value), allValues)
  const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
  return normalize(next, allValues)
}

/** Tap on the "All" row: ticked -> nothing, unticked -> everything. */
export function toggleAll(selected, allValues) {
  return isAll(selected, allValues) ? NONE_SELECTED : []
}

/**
 * Drop values that are no longer offered (e.g. months outside a newly
 * selected FY). An explicit selection pruned to nothing resets to [] - the
 * user didn't ask for "none", their months just stopped existing.
 */
export function pruneSelection(selected, allValues) {
  if (isNone(selected) || selected.length === 0) return selected
  const valid = new Set(allValues)
  const next = selected.filter((v) => valid.has(v))
  if (next.length === 0) return []
  if (allValues.every((v) => next.includes(v))) return []
  return next.length === selected.length ? selected : next
}

/** Closed-control text: All / None / the one option's label / "N selected". */
export function selectionSummary(selected, options) {
  const allValues = options.map((o) => o.value)
  if (isNone(selected)) return 'None'
  if (isAll(selected, allValues)) return 'All'
  if (selected.length === 1) {
    const opt = options.find((o) => o.value === selected[0])
    return opt ? opt.label : selected[0]
  }
  return `${selected.length} selected`
}
