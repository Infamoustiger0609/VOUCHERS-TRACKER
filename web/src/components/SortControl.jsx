import { useEffect, useRef, useState } from 'react'

const FIELDS = [
  { key: 'REVENUE', label: 'Revenue' },
  { key: 'DATE', label: 'Date (Validity From)' },
  { key: 'PCT', label: 'Redemption Rate' },
]

function ArrowIcon({ dir }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease' }}
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

export default function SortControl({ field, dir, onChange, amountLabel }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const fieldLabel = (key) => (key === 'REVENUE' ? amountLabel : FIELDS.find((f) => f.key === key)?.label)

  function pick(key) {
    if (key === field) {
      onChange(key, dir === 'desc' ? 'asc' : 'desc')
    } else {
      onChange(key, 'desc')
    }
    setOpen(false)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 11.5,
          padding: 0,
        }}
      >
        <span>Sorted by {fieldLabel(field)}</span>
        <ArrowIcon dir={dir} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 200,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 12,
            padding: 6,
            zIndex: 30,
            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          }}
        >
          {FIELDS.map((f) => {
            const active = f.key === field
            return (
              <div
                key={f.key}
                role="option"
                aria-selected={active}
                onClick={() => pick(f.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: active ? 'var(--accent)' : 'var(--text-primary)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span>{f.key === 'REVENUE' ? amountLabel : f.label}</span>
                {active && <ArrowIcon dir={dir} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
