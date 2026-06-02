'use client'

import { useState } from 'react'

export function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    const next = !following
    setFollowing(next) // optimistic
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: next ? 'POST' : 'DELETE' })
      if (!res.ok) setFollowing(!next) // revert on failure
    } catch {
      setFollowing(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        following
          ? 'border border-smoke text-steel text-sm font-medium px-4 py-2 hover:border-steel hover:text-ink transition-colors disabled:opacity-60'
          : 'bg-brand-red text-paper font-bold text-sm tracking-wide px-4 py-2 hover:bg-brand-red-dark transition-colors disabled:opacity-60'
      }
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
