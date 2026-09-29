// Category and Pace badge color mappings, shared across every scheme table
// (NEFT/Kotak/Offers detail pages).

const CATEGORY_STYLES = {
  Ticket: { bg: 'rgba(74,144,226,0.12)', color: '#2E5FA3' },
  'F&B': { bg: 'rgba(22,163,74,0.12)', color: '#15803D' },
  'Ticket & F&B': { bg: 'rgba(139,92,246,0.12)', color: '#6D28D9' },
}
const DEFAULT_CATEGORY_STYLE = { bg: 'rgba(107,91,80,0.12)', color: '#6B5B50' }

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE
}

export function paceStyle(pace) {
  if (!pace) return DEFAULT_CATEGORY_STYLE
  if (pace === 'Ahead') return { bg: 'rgba(22,163,74,0.12)', color: '#15803D' }
  if (pace === 'Behind') return { bg: 'rgba(217,119,6,0.12)', color: '#B45309' }
  if (pace === 'On pace') return { bg: 'rgba(139,92,246,0.12)', color: '#6D28D9' }
  if (pace.startsWith('Expired')) return DEFAULT_CATEGORY_STYLE
  return DEFAULT_CATEGORY_STYLE
}
