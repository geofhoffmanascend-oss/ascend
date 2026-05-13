'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SubRequestActions({ subReqId, action }: { subReqId: string; action: 'claim' | 'cancel' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handle() {
    setLoading(true)
    await fetch(`/api/instructor/sub-requests/${subReqId}`, {
      method: action === 'claim' ? 'POST' : 'DELETE',
    })
    setLoading(false)
    router.refresh()
  }

  if (action === 'claim') {
    return (
      <button
        onClick={handle}
        disabled={loading}
        className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40 flex-shrink-0"
      >
        {loading ? 'Claiming…' : "I'll Cover It"}
      </button>
    )
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-40 flex-shrink-0"
    >
      {loading ? '…' : 'Cancel'}
    </button>
  )
}
