'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type EventStatus = 'pending' | 'approved' | 'rejected'
type EventType = 'open_mat' | 'competition' | 'seminar' | 'other'

interface Event {
  id: string
  title: string
  type: EventType
  city: string | null
  state: string | null
  startDate: string
  status: EventStatus
  rejectionNote: string | null
  gym: { name: string } | null
}

const STATUS_STYLES: Record<EventStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const TYPE_LABELS: Record<EventType, string> = {
  open_mat: 'Open Mat', competition: 'Competition', seminar: 'Seminar', other: 'Other',
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events/my')
      .then(r => r.json())
      .then(data => setEvents(data.events ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href="/events" className="text-xs text-ash hover:text-ink transition-colors">← Events</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">My Submissions</span>
        </div>
        <h1 className="font-display text-2xl text-ink">My Events</h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-mist animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ash text-sm mb-4">You haven&apos;t submitted any events yet.</p>
          <Link href="/events/new" className="px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
            Submit an Event
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map(event => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-ink truncate">{event.title}</p>
                  <p className="text-xs text-ash mt-0.5">
                    <span suppressHydrationWarning>{TYPE_LABELS[event.type]} · {[event.city, event.state].filter(Boolean).join(', ')} · {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </p>
                  {event.status === 'rejected' && event.rejectionNote && (
                    <p className="text-xs text-red-600 mt-1">Reason: {event.rejectionNote}</p>
                  )}
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[event.status]}`}>
                  {event.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
