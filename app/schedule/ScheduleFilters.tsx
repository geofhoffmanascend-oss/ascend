'use client'

import { useRef, useEffect, useState } from 'react'

export const ALL_TYPES = [
  'gi', 'nogi', 'muay_thai', 'wrestling', 'self_defense',
  'fundamentals', 'nogi_fundamentals', 'competition_prep', 'kids', 'seminar', 'open_mat',
]

export const ALL_TIMES = ['am', 'noon', 'pm'] as const

export type Filters = {
  types: string[]
  times: string[]
}

export const DEFAULT_FILTERS: Filters = {
  types: [...ALL_TYPES],
  times: [...ALL_TIMES],
}

const TYPE_OPTIONS = [
  { key: 'gi',               label: 'Gi (Jiu-Jitsu)' },
  { key: 'nogi',             label: 'No-Gi (Jiu-Jitsu)' },
  { key: 'muay_thai',        label: 'Muay Thai' },
  { key: 'wrestling',        label: 'Wrestling' },
  { key: 'self_defense',     label: 'Self Defense' },
  { key: 'fundamentals',     label: 'Basics (Gi)' },
  { key: 'nogi_fundamentals',label: 'Basics (No-Gi)' },
  { key: 'competition_prep', label: 'Comp Prep' },
  { key: 'kids',             label: 'Kids' },
  { key: 'seminar',          label: 'Seminar' },
  { key: 'open_mat',         label: 'Open Mat' },
]

const TIME_OPTIONS = [
  { key: 'am',   label: 'AM (before noon)' },
  { key: 'noon', label: 'Noon (12–2pm)' },
  { key: 'pm',   label: 'Evening (after 2pm)' },
]

function activeFilterCount(filters: Filters) {
  return (ALL_TYPES.length - filters.types.length) + (ALL_TIMES.length - filters.times.length)
}

export function ScheduleFilters({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const count = activeFilterCount(filters)

  function toggleType(key: string) {
    const next = filters.types.includes(key)
      ? filters.types.filter(t => t !== key)
      : [...filters.types, key]
    // Prevent unchecking all
    onChange({ ...filters, types: next.length === 0 ? [...ALL_TYPES] : next })
  }

  function toggleTime(key: string) {
    const next = filters.times.includes(key)
      ? filters.times.filter(t => t !== key)
      : [...filters.times, key]
    onChange({ ...filters, times: next.length === 0 ? [...ALL_TIMES] : next })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold transition-colors ${
          count > 0
            ? 'bg-brand-red text-paper'
            : 'border border-smoke text-steel hover:border-steel hover:text-ink'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filter
        {count > 0 && (
          <span className="bg-paper text-brand-red text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-paper border border-smoke shadow-lg w-72 p-4 flex flex-col gap-4">
          {/* Class Types */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-steel">Class Types</p>
              <button
                onClick={() => onChange({ ...filters, types: [...ALL_TYPES] })}
                className="text-xs text-ash hover:text-ink transition-colors"
              >
                Select all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
              {TYPE_OPTIONS.map(t => (
                <label key={t.key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(t.key)}
                    onChange={() => toggleType(t.key)}
                    className="accent-brand-red shrink-0"
                  />
                  <span className="text-sm text-ink group-hover:text-brand-red transition-colors leading-tight">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-smoke" />

          {/* Time of Day */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-steel">Time of Day</p>
              <button
                onClick={() => onChange({ ...filters, times: [...ALL_TIMES] })}
                className="text-xs text-ash hover:text-ink transition-colors"
              >
                Select all
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {TIME_OPTIONS.map(t => (
                <label key={t.key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.times.includes(t.key)}
                    onChange={() => toggleTime(t.key)}
                    className="accent-brand-red shrink-0"
                  />
                  <span className="text-sm text-ink group-hover:text-brand-red transition-colors">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {count > 0 && (
            <>
              <div className="h-px bg-smoke" />
              <button
                onClick={() => onChange(DEFAULT_FILTERS)}
                className="text-xs text-ash hover:text-ink transition-colors text-left"
              >
                Reset all filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
