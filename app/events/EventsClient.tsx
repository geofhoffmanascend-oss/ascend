'use client'

import { useState } from 'react'
import Link from 'next/link'

type EventType = 'open_mat' | 'competition' | 'seminar' | 'other'
type ViewMode = 'grid' | 'list' | 'month'

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
  href: string
}

const TYPE_LABELS: Record<EventType, string> = {
  open_mat: 'Open Mat',
  competition: 'Competition',
  seminar: 'Seminar',
  other: 'Other',
}

// Badge styles (existing convention)
const TYPE_STYLES: Record<EventType, string> = {
  open_mat: 'bg-green-100 text-green-700',
  competition: 'bg-red-100 text-red-700',
  seminar: 'bg-blue-100 text-blue-700',
  other: 'bg-mist text-steel',
}

// Solid dot colors for the month grid
const TYPE_DOTS: Record<EventType, string> = {
  open_mat: 'bg-green-600',
  competition: 'bg-brand-red',
  seminar: 'bg-blue-600',
  other: 'bg-steel',
}

const FILTERS: { key: EventType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open_mat', label: 'Open Mat' },
  { key: 'competition', label: 'Competition' },
  { key: 'seminar', label: 'Seminar' },
]

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'grid', label: 'Grid' },
  { key: 'list', label: 'List' },
  { key: 'month', label: 'Month' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function eventLocationLine(event: Event) {
  return [event.location, [event.city, event.state].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ')
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month }
}

export function EventsClient({ events }: { events: Event[] }) {
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const eventsForDay = (day: number) => {
    return filtered.filter(e => {
      const d = new Date(e.startDate)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const isToday = (day: number) => {
    const t = new Date()
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
  }

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1))
      return d
    })
    setSelectedDay(null)
  }

  return (
    <div>
      {/* Filters + view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-2 flex-wrap">
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
        <div className="flex border border-smoke overflow-hidden">
          {VIEWS.map((v, i) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                i > 0 ? 'border-l border-smoke' : ''
              } ${view === v.key ? 'bg-ink text-paper' : 'bg-paper text-steel hover:text-ink'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state (grid/list only — month always renders the grid) */}
      {filtered.length === 0 && view !== 'month' ? (
        <p className="text-ash text-sm italic">
          No upcoming events found.{' '}
          <Link href="/events/new" className="text-brand-red hover:underline">Be the first to submit one →</Link>
        </p>
      ) : view === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(event => (
            <Link
              key={`${event.type}-${event.id}`}
              href={event.href}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex flex-col"
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${TYPE_STYLES[event.type]}`}>
                  {TYPE_LABELS[event.type]}
                </span>
                <span suppressHydrationWarning className="text-xs text-ash">{formatEventDate(event.startDate)}</span>
              </div>
              <p className="font-display text-base font-bold text-ink mb-1">{event.title}</p>
              {eventLocationLine(event) && (
                <p className="text-xs text-ash">{eventLocationLine(event)}</p>
              )}
              {event.gym && (
                <p className="text-xs text-steel mt-auto pt-2 font-medium">{event.gym.name}</p>
              )}
            </Link>
          ))}
        </div>
      ) : view === 'list' ? (
        /* LIST VIEW */
        <div className="flex flex-col gap-3">
          {filtered.map(event => (
            <Link
              key={`${event.type}-${event.id}`}
              href={event.href}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${TYPE_STYLES[event.type]}`}>
                      {TYPE_LABELS[event.type]}
                    </span>
                    <span suppressHydrationWarning className="text-xs text-ash">{formatEventDate(event.startDate)}</span>
                  </div>
                  <p className="font-display text-base font-bold text-ink truncate">{event.title}</p>
                  {eventLocationLine(event) && (
                    <p className="text-xs text-ash mt-0.5">{eventLocationLine(event)}</p>
                  )}
                  {event.gym && (
                    <p className="text-xs text-steel mt-0.5 font-medium">{event.gym.name}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* MONTH VIEW */
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between border border-smoke bg-paper px-4 py-3 mb-3">
            <button
              onClick={() => navigateMonth('prev')}
              aria-label="Previous month"
              className="px-2 py-1 text-steel hover:text-ink transition-colors text-lg leading-none"
            >
              ‹
            </button>
            <h2 suppressHydrationWarning className="font-display text-lg font-bold text-ink">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              aria-label="Next month"
              className="px-2 py-1 text-steel hover:text-ink transition-colors text-lg leading-none"
            >
              ›
            </button>
          </div>

          {/* Calendar grid */}
          <div className="border-l border-t border-smoke bg-paper">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-mist border-b border-smoke">
              {WEEKDAYS.map(d => (
                <div key={d} className="p-2 text-center text-xs font-bold uppercase tracking-wide text-steel">
                  {d}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-20 bg-mist/40 border-r border-b border-smoke" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1
                const dayEvents = eventsForDay(day)
                const today = isToday(day)
                const isSelected = selectedDay?.getDate() === day &&
                  selectedDay?.getMonth() === month && selectedDay?.getFullYear() === year
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(new Date(year, month, day))}
                    className={`min-h-20 p-1.5 border-r border-b border-smoke text-left hover:bg-mist transition-colors ${
                      today ? 'bg-brand-red/5' : ''
                    } ${isSelected ? 'ring-2 ring-brand-red ring-inset' : ''}`}
                  >
                    <div className={`text-xs font-bold mb-1 ${today ? 'text-brand-red' : 'text-ink'}`}>{day}</div>
                    <div className="flex flex-wrap gap-1">
                      {dayEvents.slice(0, 4).map(e => (
                        <span key={`${e.type}-${e.id}`} className={`w-2 h-2 rounded-full ${TYPE_DOTS[e.type]}`} title={e.title} />
                      ))}
                      {dayEvents.length > 4 && (
                        <span className="text-[10px] text-ash leading-none">+{dayEvents.length - 4}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day events */}
          {selectedDay && (() => {
            const dayEvents = eventsForDay(selectedDay.getDate())
            return (
              <div className="mt-4 border border-smoke bg-paper p-4">
                <h3 className="font-display text-sm font-bold text-ink mb-3">
                  {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                {dayEvents.length === 0 ? (
                  <p className="text-ash text-sm italic">No events on this day.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dayEvents.map(event => (
                      <Link
                        key={`${event.type}-${event.id}`}
                        href={event.href}
                        className="border border-smoke p-3 hover:border-steel transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${TYPE_STYLES[event.type]}`}>
                            {TYPE_LABELS[event.type]}
                          </span>
                        </div>
                        <p className="font-display text-sm font-bold text-ink">{event.title}</p>
                        {eventLocationLine(event) && (
                          <p className="text-xs text-ash mt-0.5">{eventLocationLine(event)}</p>
                        )}
                        {event.gym && (
                          <p className="text-xs text-steel mt-0.5 font-medium">{event.gym.name}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Legend */}
          <div className="mt-4 border border-smoke bg-paper p-3">
            <div className="flex flex-wrap gap-3 text-xs text-steel">
              {(Object.keys(TYPE_LABELS) as EventType[]).map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${TYPE_DOTS[t]}`} />
                  <span>{TYPE_LABELS[t]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
