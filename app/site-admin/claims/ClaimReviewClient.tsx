'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Claim = {
  id: string
  note: string | null
  createdAt: string
  gym: { id: string; name: string; slug: string; city: string | null; state: string | null; memberCount: number }
  user: { id: string; name: string | null; email: string }
}

export function ClaimReviewClient({ claims: initial }: { claims: Claim[] }) {
  const router = useRouter()
  const [claims, setClaims] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  async function act(id: string, action: 'approve' | 'reject', reviewNote?: string) {
    setBusy(id)
    const res = await fetch(`/api/site-admin/claims/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewNote }),
    })
    setBusy(null)
    if (res.ok) {
      setClaims(c => c.filter(x => x.id !== id))
      setRejectingId(null); setReason('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Action failed.')
    }
  }

  if (claims.length === 0) {
    return <p className="text-ash text-sm italic">No pending gym claims.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {claims.map(c => (
        <div key={c.id} className="border border-smoke bg-paper p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <Link href={`/site-admin/gyms/${c.gym.id}`} className="text-sm font-medium text-brand-red hover:underline">{c.gym.name}</Link>
              <p className="text-xs text-ash mt-0.5">
                {[c.gym.city, c.gym.state].filter(Boolean).join(', ') || 'No location'} · {c.gym.memberCount} member{c.gym.memberCount === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-slate mt-2">
                Claimant: <Link href={`/site-admin/users/${c.user.id}`} className="text-ink hover:underline">{c.user.name ?? c.user.email}</Link> ({c.user.email})
              </p>
              {c.note && <p className="text-sm text-ink mt-2 whitespace-pre-wrap break-words border-l-2 border-smoke pl-3">{c.note}</p>}
            </div>
            <span className="text-xs text-ash shrink-0">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          {rejectingId === c.id ? (
            <div className="mt-3 flex flex-col gap-2">
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason (optional, shown to claimant)…"
                className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
              />
              <div className="flex gap-2">
                <button onClick={() => act(c.id, 'reject', reason)} disabled={busy === c.id} className="px-4 py-2 bg-brand-red text-paper font-bold text-xs hover:bg-red-700 transition-colors disabled:opacity-60">Confirm decline</button>
                <button onClick={() => { setRejectingId(null); setReason('') }} className="px-4 py-2 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={() => act(c.id, 'approve')} disabled={busy === c.id} className="px-4 py-2 bg-brand-red text-paper font-bold text-xs hover:bg-red-700 transition-colors disabled:opacity-60">
                {busy === c.id ? '…' : 'Approve & transfer'}
              </button>
              <button onClick={() => setRejectingId(c.id)} disabled={busy === c.id} className="px-4 py-2 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors">Decline</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
