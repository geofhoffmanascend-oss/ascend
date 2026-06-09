'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Gym = { id: string; name: string; slug: string; city: string | null; state: string | null; headInstructorName: string | null; memberCount: number }

export function ClaimClient() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Gym[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Gym | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selected) return
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/gyms/claimable?q=${encodeURIComponent(q)}`)
      const data = await res.json().catch(() => [])
      setResults(Array.isArray(data) ? data : [])
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q, selected])

  async function submit() {
    if (!selected) return
    setSubmitting(true); setError('')
    const res = await fetch(`/api/gyms/${selected.id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    setSubmitting(false)
    if (res.ok) { setDone(true); return }
    const data = await res.json().catch(() => ({}))
    setError(data.error ?? 'Could not submit your claim.')
  }

  if (done && selected) {
    return (
      <div className="border border-smoke bg-paper p-6">
        <p className="text-sm text-ink font-medium mb-2">Claim submitted for <strong>{selected.name}</strong>.</p>
        <p className="text-sm text-slate">A site administrator will review it. You&apos;ll get a notification once it&apos;s approved or declined. Until then, the listing stays a community gym.</p>
        <Link href="/dashboard" className="inline-block mt-4 px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">Back to dashboard</Link>
      </div>
    )
  }

  if (selected) {
    return (
      <div className="border border-smoke bg-paper p-6 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Claiming</p>
          <p className="text-lg font-display text-ink">{selected.name}</p>
          <p className="text-xs text-ash mt-0.5">
            {[selected.city, selected.state].filter(Boolean).join(', ') || 'Location not listed'}
            {selected.memberCount > 0 && ` · ${selected.memberCount} member${selected.memberCount === 1 ? '' : 's'} already here`}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-steel">How is this your gym?</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
            placeholder="e.g. I'm the head instructor / owner. Matches my name, address, phone, or website…"
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
          <p className="text-xs text-ash">A site admin verifies this before control transfers. Add anything that proves ownership.</p>
        </div>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => { setSelected(null); setError('') }} className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">← Choose another</button>
          <button onClick={submit} disabled={submitting} className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit claim'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search by gym name, city, or state…"
        className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
      />
      {loading ? (
        <p className="text-ash text-sm">Searching…</p>
      ) : results.length === 0 ? (
        <p className="text-ash text-sm italic">No unclaimed gyms match. If your gym isn&apos;t listed, <Link href="/gyms/register" className="text-brand-red hover:underline">register it</Link> instead.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map(g => (
            <button
              key={g.id}
              onClick={() => { setSelected(g); setNote('') }}
              className="text-left border border-smoke bg-paper p-3 hover:border-steel transition-colors"
            >
              <p className="text-sm font-medium text-ink">{g.name}</p>
              <p className="text-xs text-ash mt-0.5">
                {[g.city, g.state].filter(Boolean).join(', ') || 'Location not listed'}
                {g.headInstructorName && ` · ${g.headInstructorName}`}
                {g.memberCount > 0 && ` · ${g.memberCount} member${g.memberCount === 1 ? '' : 's'}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
