'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const MESSAGES: Record<string, string> = {
  self: "You can't accept your own invite.",
  already: 'You\'ve already accepted this invite.',
  maxed: 'This invite has already been used.',
  expired: 'This invite has expired.',
  invalid: 'This invite link is invalid.',
}

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter()
  const { update } = useSession()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  async function accept() {
    setWorking(true)
    setError('')
    const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (data.error === 'already') { router.push('/dashboard'); return }
      setError(MESSAGES[data.error] ?? 'Could not accept this invite.')
      setWorking(false)
      return
    }
    // If a role was granted (instructor), refresh the session so middleware sees it.
    await update()
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={accept} disabled={working} className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
        {working ? 'Accepting…' : 'Accept invite'}
      </button>
      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  )
}
