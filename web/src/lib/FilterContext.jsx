import { createContext, useContext, useState } from 'react'

const FilterContext = createContext(null)

/**
 * Holds the FY/Month selection at the app root so it persists across
 * navigation between Overview and every bucket detail page during a
 * session. In-memory only - a hard reload resetting to "All" is expected.
 * Values follow lib/multiSelect.js: [] = All, explicit array, or
 * NONE_SELECTED. Month values are "YYYY-MM" keys.
 * Payment Mode is NOT here - it's Overview-only, doesn't apply to the
 * single-bucket detail pages.
 */
export function FilterProvider({ children }) {
  const [fySelected, setFySelected] = useState([])
  const [monthSelected, setMonthSelected] = useState([])

  return (
    <FilterContext.Provider value={{ fySelected, setFySelected, monthSelected, setMonthSelected }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useSharedFySelection() {
  const ctx = useContext(FilterContext)
  if (!ctx) {
    throw new Error('useSharedFySelection must be used within a FilterProvider')
  }
  return ctx
}
