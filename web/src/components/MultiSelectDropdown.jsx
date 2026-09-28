import { useEffect, useRef, useState } from 'react'

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B6E7A" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function Check({ checked }) {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        border: `1px solid ${checked ? '#7C5CFC' : '#3A3D46'}`,
        background: checked ? '#7C5CFC' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0D0F12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L19 8" />
        </svg>
      )}
    </span>
  )
}

/**
 * Multi-select dropdown with an "All" toggle-all row, matching the Payment
 * Mode segmented control's pattern of an explicit all-or-some choice.
 * `selected` = [] means "All" (unfiltered); a non-empty array means only
 * those values match (OR'd together).
 */
export default function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const allSelected = selected.length === 0
  const summary = allSelected
    ? 'All'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`

  function toggleAll() {
    onChange([])
  }

  function toggleOne(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      const next = [...selected, value]
      onChange(next.length >= options.length ? [] : next)
    }
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
          padding: '7px 12px',
          borderRadius: 8,
          background: '#1B1D23',
          border: '1px solid #2A2D35',
          color: '#ECEBF2',
          fontSize: 12.5,
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>{label}: {summary}</span>
        <ChevronDown />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 200,
            maxHeight: 320,
            overflowY: 'auto',
            background: '#1B1D23',
            border: '1px solid #2A2D35',
            borderRadius: 12,
            padding: 8,
            zIndex: 30,
            boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
          }}
        >
          <div
            role="option"
            aria-selected={allSelected}
            onClick={toggleAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 13,
              color: '#ECEBF2',
              cursor: 'pointer',
            }}
          >
            <Check checked={allSelected} />
            <span style={{ flexGrow: 1 }}>All</span>
          </div>

          <div style={{ height: 1, background: '#2A2D35', margin: '4px 4px' }} />

          {options.map((opt) => {
            const checked = allSelected || selected.includes(opt.value)
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={checked}
                onClick={() => toggleOne(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#ECEBF2',
                  cursor: 'pointer',
                }}
              >
                <Check checked={checked} />
                <span style={{ flexGrow: 1 }}>{opt.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
