'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RequestActions({ requestId, senderId }: { requestId: string; senderId: string }) {
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null)
  const [done, setDone] = useState<'approved' | 'denied' | null>(null)
  const router = useRouter()

  async function act(action: 'approve' | 'deny') {
    setLoading(action)
    const res = await fetch(`/api/messages/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLoading(null)
    if (res.ok) {
      setDone(action === 'approve' ? 'approved' : 'denied')
      if (action === 'approve') {
        router.push(`/messages/${senderId}`)
      } else {
        router.refresh()
      }
    }
  }

  if (done === 'denied') {
    return <p className="text-xs text-ash italic">Request declined.</p>
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act('approve')}
        disabled={!!loading}
        className="flex-1 px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
      >
        {loading === 'approve' ? 'Accepting…' : 'Accept'}
      </button>
      <button
        onClick={() => act('deny')}
        disabled={!!loading}
        className="flex-1 px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-60"
      >
        {loading === 'deny' ? 'Declining…' : 'Decline'}
      </button>
    </div>
  )
}
