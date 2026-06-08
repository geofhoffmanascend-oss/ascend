'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Phase 53 — shown app-wide when an admin is viewing as another user (read-only).
export function ViewAsBanner() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [exiting, setExiting] = useState(false)
  if (!session?.viewAs) return null

  async function exit() {
    setExiting(true)
    await update({ viewAs: null })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <span>
          👁 Viewing as <strong>{session.viewAs.viewedName ?? 'user'}</strong> — <span className="text-ash">read-only</span>
        </span>
        <button onClick={exit} disabled={exiting} className="px-3 py-1 bg-brand-red text-paper font-bold tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60 flex-shrink-0">
          {exiting ? 'Exiting…' : 'Exit view'}
        </button>
      </div>
    </div>
  )
}
