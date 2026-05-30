'use client'

import { useState } from 'react'

type EventType = 'open_mat' | 'competition' | 'seminar' | 'other'

interface Event {
  id: string
  title: string
  type: EventType
  description: string | null
  location: string | null
  city: string | null
  state: string | null
  startDate: string
  endDate: string | null
  submittedBy: { name: string | null; email: string | null }
  gym: { name: string } | null
  createdAt: string
}

const TYPE_LABELS: Record<EventType, string> = {
  open_mat: 'Open Mat', competition: 'Competition', seminar: 'Seminar', other: 'Other',
}

export function EventApprovalClient({ events: initial }: { events: Event[] }) {
  const [events, setEvents] = useState(initial)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [working, setWorking] = useState<string | null>(null)

  async function act(id: string, status: 'approved' | 'rejected', rejectionNote?: string) {
    setWorking(id)
    const res = await fetch(`/api/site-admin/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionNote }),
    })
    if (res.ok) {
      setEvents(prev => prev.filter(e => e.id !== id))
      setRejecting(null)
      setNote('')
    }
    setWorking(null)
  }

  const secondaryBtn = 'px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50'
  const primaryBtn = 'px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50'

  if (events.length === 0) {
    return <p className="text-ash text-sm italic">No pending events.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map(event => (
        <div key={event.id} className="border border-smoke bg-paper p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold uppercase tracking-wide bg-mist text-steel px-2 py-0.5">
                  {TYPE_LABELS[event.type]}
                </span>
                <span suppressHydrationWarning className="text-xs text-ash">
                  {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="font-display text-base font-bold text-ink">{event.title}</p>
              {(event.location || event.city) && (
                <p className="text-xs text-ash mt-0.5">
                  {[event.location, [event.city, event.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                </p>
              )}
              {event.gym && <p className="text-xs text-steel mt-0.5">Gym: {event.gym.name}</p>}
              {event.description && (
                <p className="text-sm text-ash mt-2 line-clamp-3">{event.description}</p>
              )}
              <p suppressHydrationWarning className="text-xs text-ash mt-2">
                Submitted by {event.submittedBy.name ?? event.submittedBy.email ?? 'Unknown'} · {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {rejecting === event.id ? (
            <div className="flex flex-col gap-2 border-t border-smoke pt-3">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-smoke text-sm text-ink bg-paper focus:outline-none focus:border-brand-red"
                placeholder="Rejection reason (optional)"
              />
              <div className="flex gap-2">
                <button onClick={() => act(event.id, 'rejected', note)} disabled={!!working} className={primaryBtn}>
                  {working === event.id ? 'Rejecting…' : 'Confirm Reject'}
                </button>
                <button onClick={() => { setRejecting(null); setNote('') }} className={secondaryBtn}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 border-t border-smoke pt-3">
              <button onClick={() => act(event.id, 'approved')} disabled={!!working} className={primaryBtn}>
                {working === event.id ? '…' : 'Approve'}
              </button>
              <button onClick={() => setRejecting(event.id)} disabled={!!working} className={secondaryBtn}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
