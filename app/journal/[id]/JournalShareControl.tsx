'use client'

import { useEffect, useState } from 'react'

type Person = { id: string; name: string | null }
type Share = { id: string; toUserId: string; name: string; status: 'active' | 'pending' }

export function JournalShareControl({ logId, instructorCanSee }: { logId: string; instructorCanSee: boolean }) {
  const [shares, setShares] = useState<Share[]>([])
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/training-logs/${logId}/share`).then(r => r.json()).then(d => Array.isArray(d) && setShares(d))
  }, [logId])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      fetch(`/api/journal-shares/connections?q=${encodeURIComponent(q)}`).then(r => r.json()).then(d => Array.isArray(d) ? setResults(d) : setResults([]))
    }, 200)
    return () => clearTimeout(t)
  }, [q, open])

  async function add(p: Person) {
    if (shares.some(s => s.toUserId === p.id)) return
    setBusy(true)
    const res = await fetch(`/api/training-logs/${logId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toUserId: p.id }) })
    const data = await res.json()
    if (res.ok) setShares(s => [...s, data])
    setBusy(false); setQ('')
  }
  async function remove(s: Share) {
    setBusy(true)
    await fetch(`/api/training-logs/${logId}/share?toUserId=${s.toUserId}`, { method: 'DELETE' })
    setShares(x => x.filter(y => y.toUserId !== s.toUserId))
    setBusy(false)
  }

  return (
    <div className="border border-smoke bg-paper p-4 mb-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Who can see this</p>
        <button onClick={() => setOpen(o => !o)} className="text-xs font-semibold text-brand-red hover:underline">{open ? 'Done' : 'Share with…'}</button>
      </div>

      {instructorCanSee && <p className="text-xs text-ash mt-2">Your gym&apos;s instructors can see this entry (it isn&apos;t marked private).</p>}

      {shares.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {shares.map(s => (
            <span key={s.toUserId} className="inline-flex items-center gap-1 px-2 py-1 bg-mist border border-smoke text-xs text-ink">
              {s.name}{s.status === 'pending' && <span className="text-ash">(pending)</span>}
              <button onClick={() => remove(s)} disabled={busy} className="text-brand-red font-bold">✕</button>
            </span>
          ))}
        </div>
      )}
      {shares.length === 0 && !instructorCanSee && <p className="text-xs text-ash mt-2">Only you can see this entry.</p>}

      {open && (
        <div className="mt-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search teammates, coaches…" className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
          {results.length > 0 && (
            <div className="border border-smoke border-t-0 max-h-48 overflow-y-auto">
              {results.filter(p => !shares.some(s => s.toUserId === p.id)).map(p => (
                <button key={p.id} onClick={() => add(p)} disabled={busy} className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-mist transition-colors">{p.name ?? 'User'}</button>
              ))}
            </div>
          )}
          <p className="text-xs text-ash mt-2">You can share with anyone at your gym, people you follow or who follow you, and private-lesson partners.</p>
        </div>
      )}
    </div>
  )
}
