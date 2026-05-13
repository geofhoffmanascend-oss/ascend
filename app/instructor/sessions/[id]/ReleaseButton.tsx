'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReleaseButton({ sessionId, alreadyReleased }: { sessionId: string; alreadyReleased: boolean }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (alreadyReleased) {
    return (
      <span className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-800 font-bold uppercase">
        Sub Requested
      </span>
    )
  }

  async function release() {
    setLoading(true)
    await fetch(`/api/instructor/sessions/${sessionId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-brand-red hover:text-brand-red transition-colors"
      >
        Release Session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="bg-paper border border-smoke w-full max-w-sm p-6">
            <p className="font-display text-base font-bold text-ink mb-1">Release this session?</p>
            <p className="text-xs text-ash mb-4">All instructors will be notified that this session needs coverage.</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note (reason, instructions…)"
              rows={3}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={release}
                disabled={loading}
                className="flex-1 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {loading ? 'Sending…' : 'Release & Notify'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
