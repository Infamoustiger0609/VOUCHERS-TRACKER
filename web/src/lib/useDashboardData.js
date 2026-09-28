import { useEffect, useState } from 'react'

/**
 * Fetches the pipeline's JSON cubes (copied into public/data by
 * scripts/sync-data.mjs) and returns them plus loading/error state.
 * The pipeline itself is never touched here - this only reads its output.
 */
export function useDashboardData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    schemes: [],
    monthly: [],
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [schemesRes, monthlyRes] = await Promise.all([
          fetch('/data/schemes.json'),
          fetch('/data/monthly_recognized.json'),
        ])
        if (!schemesRes.ok || !monthlyRes.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const [schemes, monthly] = await Promise.all([
          schemesRes.json(),
          monthlyRes.json(),
        ])
        if (!cancelled) {
          setState({ loading: false, error: null, schemes, monthly })
        }
      } catch (err) {
        if (!cancelled) {
          setState({ loading: false, error: err, schemes: [], monthly: [] })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
