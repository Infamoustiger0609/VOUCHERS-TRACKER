// Category and Pace badge color mappings, shared across every scheme table
// (NEFT/Kotak/Offers detail pages).

const CATEGORY_STYLES = {
  Ticket: { bg: 'rgba(92,200,252,0.14)', color: '#7FD4FF' },
  'F&B': { bg: 'rgba(52,211,153,0.14)', color: '#5EE0AE' },
  'Ticket & F&B': { bg: 'rgba(124,92,252,0.16)', color: '#B7A6FF' },
}
const DEFAULT_CATEGORY_STYLE = { bg: 'rgba(90,93,104,0.25)', color: '#9497A3' }

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE
}

export function paceStyle(pace) {
  if (!pace) return DEFAULT_CATEGORY_STYLE
  if (pace === 'Ahead') return { bg: 'rgba(52,211,153,0.14)', color: '#5EE0AE' }
  if (pace === 'Behind') return { bg: 'rgba(242,132,75,0.14)', color: '#F2A44B' }
  if (pace === 'On pace') return { bg: 'rgba(124,92,252,0.14)', color: '#B7A6FF' }
  if (pace.startsWith('Expired')) return { bg: 'rgba(90,93,104,0.25)', color: '#9497A3' }
  return DEFAULT_CATEGORY_STYLE
}
