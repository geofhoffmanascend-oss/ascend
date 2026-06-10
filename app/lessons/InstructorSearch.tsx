'use client'

import { useState } from 'react'
import Link from 'next/link'

type Result = { id: string; name: string | null; belt: string | null; beltVerified?: boolean; avatarUrl: string | null; kind?: 'class' | 'private'; gymName: string; gymSlug: string | null; miles: number }

function cap(s: string | null) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

export function InstructorSearch() {
  const [open, setOpen] = useState(false)
  const [location, setLocation] = useState('')
  const [miles, setMiles] = useState('25')
  const [results, setResults] = useState<Result[] | null>(null)
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!location.trim()) return
    setSearching(true); setMessage('')
    const res = await fetch(`/api/instructors/search?location=${encodeURIComponent(location)}&miles=${miles}`)
    const data = await res.json()
    setResults(data.results ?? [])
    setMessage(data.message ?? '')
    setSearching(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-brand-red hover:underline">
        Search for instructors beyond my gym →
      </button>
    )
  }

  return (
    <div className="border border-smoke bg-paper p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Find instructors near a location</p>
        <button onClick={() => setOpen(false)} className="text-xs text-ash hover:text-ink">Close</button>
      </div>
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, state or ZIP"
          className="flex-1 min-w-40 px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
        <select value={miles} onChange={e => setMiles(e.target.value)} className="px-3 py-2 border border-smoke bg-paper text-ink text-sm">
          {['10', '25', '50', '100'].map(m => <option key={m} value={m}>{m} mi</option>)}
        </select>
        <button type="submit" disabled={searching} className="px-4 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
          {searching ? '…' : 'Search'}
        </button>
      </form>

      {message && <p className="text-sm text-ash">{message}</p>}
      {results && results.length === 0 && !message && <p className="text-sm text-ash">No instructors accepting outside requests within {miles} mi.</p>}
      {results && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map(r => (
            <div key={r.id} className="border border-smoke bg-paper p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-smoke flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-mist border border-smoke flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    <Link href={`/profile/${r.id}`} className="text-ink hover:text-brand-red transition-colors">{r.name ?? 'Instructor'}</Link>
                    {r.belt && <span className="text-ash font-normal"> · {cap(r.belt)} belt{r.beltVerified ? ' ✓' : ''}</span>}
                  </p>
                  <p className="text-xs truncate">
                    <span className={`font-semibold ${r.kind === 'private' ? 'text-brand-red' : 'text-steel'}`}>
                      {r.kind === 'private' ? 'Private Instructor' : 'Class Instructor'}
                    </span>
                    {r.kind === 'private'
                      ? <span className="text-ash"> · vetted</span>
                      : r.gymSlug && <span className="text-ash"> · <Link href={`/gyms/${r.gymSlug}`} className="hover:text-ink">{r.gymName}</Link></span>}
                    <span className="text-ash"> · {r.miles} mi</span>
                  </p>
                </div>
              </div>
              <Link href={`/lessons/new?instructor=${r.id}`} className="px-3 py-1.5 bg-brand-red text-paper font-bold text-xs hover:bg-red-700 transition-colors flex-shrink-0">Request</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
