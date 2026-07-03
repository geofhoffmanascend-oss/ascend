'use client'

import { useState } from 'react'

interface JoinButtonProps {
  gymId: string
  isMember: boolean
  membershipStatus?: string | null
}

export function JoinButton({ gymId, isMember, membershipStatus }: JoinButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'joined' | 'pending' | 'error'>('idle')

  if (isMember) {
    return (
      <span className="inline-block px-4 py-2 border border-smoke text-sm text-slate font-medium">
        {membershipStatus === 'pending' ? 'Pending approval' : 'This is your gym'}
      </span>
    )
  }

  if (status === 'joined') {
    return <span className="inline-block px-4 py-2 border border-smoke text-sm text-slate font-medium">This is your gym</span>
  }
  if (status === 'pending') {
    return <span className="inline-block px-4 py-2 border border-smoke text-sm text-slate font-medium">Pending approval</span>
  }

  async function handleJoin() {
    setLoading(true)
    try {
      const res = await fetch(`/api/gyms/${gymId}/membership`, { method: 'PUT' })
      const data = await res.json()
      if (res.ok) {
        setStatus(data.membership?.status === 'pending' ? 'pending' : 'joined')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
    >
      {loading ? 'Saving…' : 'Set as my gym'}
    </button>
  )
}
