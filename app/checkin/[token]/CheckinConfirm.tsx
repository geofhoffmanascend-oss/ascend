'use client'

import { useState } from 'react'

type Session = { id: string; title: string; time: string }

export function CheckinConfirm({
  token,
  studentName,
  sessions,
}: {
  token: string
  studentName: string
  sessions: Session[]
}) {
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? '')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const selected = sessions.find(s => s.id === selectedId)

  async function confirm() {
    setState('loading')
    const res = await fetch('/api/checkin/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: token, classSessionId: selectedId || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      setState('done')
      setMessage(data.class)
    } else {
      setState('error')
      setMessage(data.error ?? 'Check-in failed.')
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-ink mb-1">Checked In</h1>
          <p className="text-steel text-sm">{studentName} · {message}</p>
        </div>
      </div>
    )
  }

  // ── No classes today ──────────────────────────────────────────────────────────
  if (sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="text-center max-w-sm">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              AscendIt
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink mb-2">{studentName}</h1>
          <p className="text-ash text-sm">No registered classes found for today.</p>
          <p className="text-ash text-xs mt-1">Register for a class on the schedule first.</p>
        </div>
      </div>
    )
  }

  // ── Confirm ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              AscendIt
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Check In</h1>
          <p className="text-steel text-base mt-1 font-medium">{studentName}</p>
        </div>

        {sessions.length > 1 && (
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-steel block mb-2">
              Select Class
            </label>
            <div className="flex flex-col gap-2">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-4 py-3 border transition-colors ${
                    selectedId === s.id
                      ? 'border-brand-red bg-brand-red/5 text-ink'
                      : 'border-smoke text-steel hover:border-steel'
                  }`}
                >
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-ash">{s.time}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 1 && (
          <div className="mb-6 px-4 py-3 border border-smoke bg-mist text-center">
            <p className="text-sm font-medium text-ink">{selected?.title}</p>
            <p className="text-xs text-ash">{selected?.time}</p>
          </div>
        )}

        {state === 'error' && (
          <p className="text-sm text-brand-red mb-4 text-center">{message}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={confirm}
            disabled={state === 'loading' || !selectedId}
            className="flex-1 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-50"
          >
            {state === 'loading' ? 'Checking in…' : 'Yes, Check In'}
          </button>
          <a
            href="/"
            className="flex-1 py-3 border border-smoke text-steel text-sm font-medium text-center hover:border-steel hover:text-ink transition-colors"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}
