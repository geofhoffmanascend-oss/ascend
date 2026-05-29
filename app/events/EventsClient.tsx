'use client'

import { useState } from 'react'
import Link from 'next/link'

type EventType = 'open_mat' | 'competition' | 'seminar' | 'other'

interface Event {
  id: string
  title: string
  type: EventType
  location: string | null
  city: string | null
  state: string | null
  startDate: string
  endDate: string | null
  gym: { name: string; slug: string; logoUrl: string | null } | null
}

const TYPE_LABELS: Record<EventType, string> = {
  open_mat: 'Open Mat',
  competition: 'Competition',
  seminar: 'Seminar',
  other: 'Other',
}

const TYPE_STYLES: Record<EventType, string> = {
  open_mat: 'bg-green-100 text-green-700',
  competition: 'bg-red-100 text-red-700',
  seminar: 'bg-blue-100 text-blue-700',
  other: 'bg-mist text-steel',
}

const FILTERS: { key: EventType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open_mat', label: 'Open Mat' },
  { key: 'competition', label: 'Competition' },
  { key: 'seminar', label: 'Seminar' },
]

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function EventsClient({ events }: { events: Event[] }) {
  const [filter, setFilter] = useState<EventType | 'all'>('all')

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              filter === f.key ? 'bg-brand-red text-paper' : 'bg-mist text-steel hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ash text-sm italic">
          No upcoming events found.{' '}
          <Link href="/events/new" className="text-brand-red hover:underline">Be the first to submit one →</Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(event => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${TYPE_STYLES[event.type]}`}>
                      {TYPE_LABELS[event.type]}
                    </span>
                    <span className="text-xs text-ash">{formatEventDate(event.startDate)}</span>
                  </div>
                  <p className="font-display text-base font-bold text-ink truncate">{event.title}</p>
                  {(event.location || event.city) && (
                    <p className="text-xs text-ash mt-0.5">
                      {[event.location, [event.city, event.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {event.gym && (
                    <p className="text-xs text-steel mt-0.5 font-medium">{event.gym.name}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
