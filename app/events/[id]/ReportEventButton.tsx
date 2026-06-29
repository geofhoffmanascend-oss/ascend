'use client'

import { useState } from 'react'
import Link from 'next/link'

export function ReportEventButton({ eventId, isLoggedIn }: { eventId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  if (!isLoggedIn) {
    return (
      <p className="text-xs text-ash mt-4">
        <Link href={`/login?callbackUrl=/events/${eventId}`} className="hover:text-ink transition-colors">
          Log in to report this event
        </Link>
      </p>
    )
  }

  if (state === 'done') {
    return <p className="text-xs text-ash mt-4">Thanks — reported to the moderators.</p>
  }

  async function submit() {
    setState('sending')
    try {
      const res = await fetch(`/api/events/${eventId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (!open) {
    return (
      <p className="text-xs text-ash mt-4">
        <button onClick={() => setOpen(true)} className="hover:text-ink transition-colors">
          Report this event
        </button>
      </p>
    )
  }

  return (
    <div className="mt-4 border border-smoke bg-paper p-3 max-w-md">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Report this event</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong with this event? (optional)"
        rows={3}
        maxLength={500}
        className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={submit}
          disabled={state === 'sending'}
          className="px-4 py-2 bg-brand-red text-paper font-bold text-xs tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Submit report'}
        </button>
        <button
          onClick={() => { setOpen(false); setState('idle') }}
          className="px-4 py-2 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Cancel
        </button>
        {state === 'error' && <span className="text-xs text-brand-red">Couldn&apos;t send — try again.</span>}
      </div>
    </div>
  )
}
