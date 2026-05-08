'use client'

import { useState } from 'react'

export function CheckinButton({ classSessionId }: { classSessionId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  if (state === 'done') {
    return (
      <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-red border border-brand-red shrink-0">
        Checked In
      </span>
    )
  }

  async function checkin(e: React.MouseEvent) {
    e.preventDefault()
    setState('loading')
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classSessionId }),
    })
    if (res.ok) {
      setState('done')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Check-in failed')
      setState('error')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        onClick={checkin}
        disabled={state === 'loading'}
        className="px-3 py-1.5 bg-brand-red text-paper text-xs font-bold uppercase tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-50 shrink-0"
      >
        {state === 'loading' ? 'Checking in…' : 'Check In'}
      </button>
      {state === 'error' && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  )
}
