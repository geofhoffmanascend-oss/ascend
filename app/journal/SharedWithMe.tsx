'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = { id: string; logId: string; title: string; ownerName: string; status: 'active' | 'pending'; date: string }

export function SharedWithMe({ items: initial }: { items: Item[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  if (items.length === 0) return null

  async function act(id: string, accept: boolean) {
    setBusy(id)
    await fetch(`/api/journal-shares/${id}`, { method: accept ? 'PATCH' : 'DELETE' })
    if (accept) setItems(x => x.map(i => i.id === id ? { ...i, status: 'active' } : i))
    else setItems(x => x.filter(i => i.id !== id))
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="mb-8">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Shared with me</p>
      <div className="flex flex-col gap-2">
        {items.map(i => i.status === 'pending' ? (
          <div key={i.id} className="border border-brand-red bg-paper p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-ink min-w-0"><strong>{i.ownerName}</strong> wants to share a journal entry with you.</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => act(i.id, true)} disabled={busy === i.id} className="px-3 py-1.5 bg-brand-red text-paper font-bold text-xs hover:bg-red-700 transition-colors">Accept</button>
              <button onClick={() => act(i.id, false)} disabled={busy === i.id} className="px-3 py-1.5 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors">Decline</button>
            </div>
          </div>
        ) : (
          <Link key={i.id} href={`/journal/${i.logId}`} className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-ink font-medium truncate">{i.title}</p>
              <p className="text-xs text-ash mt-0.5">by {i.ownerName} · {i.date}</p>
            </div>
            <span className="text-xs text-ash shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
