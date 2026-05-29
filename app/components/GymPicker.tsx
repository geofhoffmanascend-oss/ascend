'use client'

import { useState, useEffect, useRef } from 'react'

interface GymResult {
  id: string
  name: string
  slug: string
  headInstructorName: string | null
  city: string | null
  state: string | null
  participatingStatus: string
}

interface GymPickerProps {
  value?: { id: string; name: string } | null
  onChange: (gym: { id: string; name: string } | null) => void
  onCreateNew?: (name: string) => void
}

export function GymPicker({ value, onChange, onCreateNew }: GymPickerProps) {
  const [inputValue, setInputValue] = useState(value?.name ?? '')
  const [results, setResults] = useState<GymResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (value) setInputValue(value.name)
  }, [value?.id])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(val: string) {
    setInputValue(val)
    if (value) onChange(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/gyms/search?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setResults(data.gyms ?? [])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function select(gym: GymResult) {
    onChange({ id: gym.id, name: gym.name })
    setInputValue(gym.name)
    setOpen(false)
    setResults([])
  }

  const locationStr = (gym: GymResult) => {
    const parts = [
      gym.headInstructorName,
      gym.city && gym.state ? `${gym.city}, ${gym.state}` : (gym.city ?? gym.state),
    ].filter(Boolean)
    return parts.join(' · ')
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={e => handleInput(e.target.value)}
        placeholder="Search for your gym..."
        className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
        autoComplete="off"
        aria-autocomplete="list"
      />
      {open && (
        <div role="listbox" className="absolute z-50 w-full bg-paper border border-smoke shadow-md mt-1 max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate">Searching…</div>
          )}
          {!loading && results.map(gym => (
            <button
              key={gym.id}
              role="option"
              onClick={() => select(gym)}
              className="w-full text-left px-4 py-3 hover:bg-mist transition-colors border-b border-smoke last:border-b-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{gym.name}</span>
                {gym.participatingStatus === 'participating' && (
                  <span className="flex-shrink-0 text-xs text-green-600 font-medium">Participating</span>
                )}
              </div>
              {locationStr(gym) && (
                <div className="text-xs text-slate mt-0.5">{locationStr(gym)}</div>
              )}
            </button>
          ))}
          {!loading && results.length === 0 && (
            <button
              onClick={() => {
                setOpen(false)
                onCreateNew?.(inputValue)
              }}
              className="w-full text-left px-4 py-3 hover:bg-mist transition-colors text-sm"
            >
              <span className="text-slate">No results — </span>
              <span className="text-brand-red font-medium">Add my gym</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
