'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TOURS } from '@/lib/tour'
import type { TourRole } from '@/lib/tour/types'

// One-time "take a quick tour?" prompt shown on the user's first landing for a role
// whose tour hasn't been offered yet. The server decides whether to render this at all.
export function TourAutoPrompt({ role }: { role: TourRole }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  if (!open) return null

  const dismiss = (markSeen: boolean) => {
    setOpen(false)
    if (markSeen) {
      fetch('/api/tour/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }).catch(() => {})
    }
  }

  return (
    <div className="fixed inset-0 z-[2147483000] bg-ink/70 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-paper border border-smoke p-6 text-center flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="AscendIt" width={56} height={56} className="object-contain mx-auto" />
        <div>
          <h2 className="font-display text-xl text-ink">Welcome to AscendIt</h2>
          <p className="text-sm text-slate mt-1">
            Take a quick {TOURS[role].label.toLowerCase().replace(' tour', '')} tour to see everything you can do.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { dismiss(true); router.push(TOURS[role].href) }}
            className="bg-brand-red text-paper font-bold text-sm tracking-wide px-4 py-2.5 hover:bg-red-700 transition-colors"
          >
            Start the tour
          </button>
          <button onClick={() => dismiss(true)} className="text-sm text-slate px-4 py-2 hover:text-ink">
            Maybe later
          </button>
        </div>
        <p className="text-[11px] text-ash">You can replay it anytime from Settings or Help.</p>
      </div>
    </div>
  )
}
