import { useEffect, useRef, useState } from 'react'

/**
 * Custom styled select dropdown — replaces native <select> elements.
 *
 * Props:
 *   value        — current selected value
 *   onChange     — called with the new value string
 *   options      — [{ value, label }]
 *   className    — extra classes for the trigger button
 *   placeholder  — shown when no value matches (optional)
 */
export default function Select({ value, onChange, options, className = '', placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          input w-full flex items-center justify-between gap-2 text-left pr-2.5
          ${open ? 'border-baxa-ink/20 ring-2 ring-baxa-ink/[0.06]' : ''}
        `}
      >
        <span className={selected ? 'text-baxa-ink' : 'text-black/30'}>
          {selected ? selected.label : (placeholder || 'Select…')}
        </span>
        <svg
          className={`shrink-0 text-black/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full min-w-[160px] bg-white border border-black/[0.08] rounded-xl shadow-lg overflow-hidden"
          style={{ animation: 'selectFadeIn 0.12s ease' }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`
                  w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors
                  ${i > 0 ? 'border-t border-black/[0.04]' : ''}
                  ${isSelected
                    ? 'bg-baxa-cream text-baxa-ink font-semibold'
                    : 'text-baxa-ink/70 hover:bg-baxa-cream/60 hover:text-baxa-ink'}
                `}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BF5700"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes selectFadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}
