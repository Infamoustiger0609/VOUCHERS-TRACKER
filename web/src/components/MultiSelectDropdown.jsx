import { useEffect, useRef, useState } from 'react'
import { isAll, isChecked, selectionSummary, toggleAll, toggleOption } from '../lib/multiSelect'

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
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
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-medium)'}`,
        background: checked ? 'var(--accent)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L19 8" />
        </svg>
      )}
    </span>
  )
}

/**
 * Multi-select dropdown with an "All" toggle-all row. Selection semantics
 * ([] = All, explicit array, NONE_SELECTED = nothing) live in
 * lib/multiSelect.js - this component only renders them.
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

  const allValues = options.map((o) => o.value)
  const allSelected = isAll(selected, allValues)
  const summary = selectionSummary(selected, options)

  function onToggleAll() {
    onChange(toggleAll(selected, allValues))
  }

  function onToggleOne(value) {
    onChange(toggleOption(selected, value, allValues))
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
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          color: 'var(--text-primary)',
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
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 12,
            padding: 8,
            zIndex: 30,
            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          }}
        >
          <div
            role="option"
            aria-selected={allSelected}
            onClick={onToggleAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Check checked={allSelected} />
            <span style={{ flexGrow: 1 }}>All</span>
          </div>

          <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 4px' }} />

          {options.map((opt) => {
            const checked = isChecked(selected, opt.value)
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={checked}
                onClick={() => onToggleOne(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-primary)',
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
