'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Phase 53 — start a read-only "view as" session for a given user.
export function ViewAsButton({ userId, className }: { userId: string; className?: string }) {
  const { update } = useSession()
  const router = useRouter()
  const [working, setWorking] = useState(false)

  async function go(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setWorking(true)
    await update({ viewAs: userId })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <button onClick={go} disabled={working} className={className ?? 'text-xs font-semibold text-steel hover:text-ink transition-colors'}>
      {working ? '…' : 'View as'}
    </button>
  )
}
