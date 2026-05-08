'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BeltBadge } from '@/app/components/BeltBadge'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

type Session = {
  id: string
  date: string
  cancelled: boolean
  cancelNote: string | null
  notes: string | null
  committedCount: number
  myCommitment: { id: string } | null
  otherCommitted: { name: string; belt: string }[]
  class: {
    id: string
    title: string
    type: string
    startTime: string
    endTime: string
    location: string | null
    instructorName: string
  }
}

type Day = { date: string; sessions: Session[] }

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function isToday(dateStr: string) {
  return new Date().toISOString().split('T')[0] === dateStr
}

export function WeeklySchedule({ days, currentMonday }: { days: Day[]; currentMonday: string }) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Record<string, Session>>(() => {
    const map: Record<string, Session> = {}
    days.forEach(d => d.sessions.forEach(s => { map[s.id] = s }))
    return map
  })
  const [expandedRoster, setExpandedRoster] = useState<string | null>(null)

  function prevWeek() { router.push(`/schedule?week=${addDays(currentMonday, -7)}`) }
  function nextWeek() { router.push(`/schedule?week=${addDays(currentMonday, 7)}`) }

  async function toggleCommit(session: Session) {
    if (session.myCommitment) {
      await fetch(`/api/commitments/${session.myCommitment.id}`, { method: 'DELETE' })
      setSessions(prev => ({
        ...prev,
        [session.id]: {
          ...prev[session.id],
          myCommitment: null,
          committedCount: prev[session.id].committedCount - 1,
        },
      }))
      if (expandedRoster === session.id) setExpandedRoster(null)
    } else {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classSessionId: session.id }),
      })
      if (res.ok) {
        const commitment = await res.json()
        setSessions(prev => ({
          ...prev,
          [session.id]: {
            ...prev[session.id],
            myCommitment: { id: commitment.id },
            committedCount: prev[session.id].committedCount + 1,
          },
        }))
      }
    }
  }

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={prevWeek}
          className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm font-medium text-ink">
          {formatDate(currentMonday)} – {formatDate(addDays(currentMonday, 6))}
        </span>
        <button
          onClick={nextWeek}
          className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const today = isToday(day.date)
          return (
            <div key={day.date}>
              <div className={`mb-2 pb-1 border-b ${today ? 'border-brand-red' : 'border-smoke'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${today ? 'text-brand-red' : 'text-steel'}`}>
                  {DAY_LABELS[i]}
                </p>
                <p className="text-xs text-ash">{formatDate(day.date)}</p>
              </div>
              <div className="flex flex-col gap-2">
                {day.sessions.length === 0 && (
                  <p className="text-xs text-ash italic">—</p>
                )}
                {day.sessions.map(s => {
                  const live = sessions[s.id] ?? s
                  const committed = !!live.myCommitment
                  return (
                    <SessionCard
                      key={s.id}
                      session={live}
                      committed={committed}
                      expanded={expandedRoster === s.id}
                      onToggleCommit={() => toggleCommit(live)}
                      onToggleRoster={() => setExpandedRoster(expandedRoster === s.id ? null : s.id)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile list */}
      <div className="md:hidden flex flex-col gap-4">
        {days.map((day, i) => {
          if (day.sessions.length === 0) return null
          const today = isToday(day.date)
          return (
            <div key={day.date}>
              <div className={`mb-2 pb-1 border-b ${today ? 'border-brand-red' : 'border-smoke'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${today ? 'text-brand-red' : 'text-steel'}`}>
                  {DAY_LABELS[i]} · {formatDate(day.date)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {day.sessions.map(s => {
                  const live = sessions[s.id] ?? s
                  const committed = !!live.myCommitment
                  return (
                    <SessionCard
                      key={s.id}
                      session={live}
                      committed={committed}
                      expanded={expandedRoster === s.id}
                      onToggleCommit={() => toggleCommit(live)}
                      onToggleRoster={() => setExpandedRoster(expandedRoster === s.id ? null : s.id)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SessionCard({
  session, committed, expanded, onToggleCommit, onToggleRoster,
}: {
  session: Session
  committed: boolean
  expanded: boolean
  onToggleCommit: () => void
  onToggleRoster: () => void
}) {
  return (
    <div className={`border bg-paper p-3 flex flex-col gap-2 ${committed ? 'border-l-2 border-l-brand-red border-t-smoke border-r-smoke border-b-smoke' : 'border-smoke'} ${session.cancelled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-xs font-bold text-ink leading-tight">{session.class.title}</p>
        <p className="text-xs text-ash mt-0.5">{session.class.startTime}–{session.class.endTime}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className="px-1.5 py-0.5 bg-mist text-steel text-xs font-bold uppercase tracking-wide">
          {TYPE_LABELS[session.class.type] ?? session.class.type}
        </span>
        {session.cancelled && (
          <span className="px-1.5 py-0.5 bg-brand-red text-paper text-xs font-bold uppercase tracking-wide">
            Cancelled
          </span>
        )}
      </div>

      <p className="text-xs text-ash">{session.class.instructorName}</p>

      {session.class.location && (
        <p className="text-xs text-ash">{session.class.location}</p>
      )}

      {!session.cancelled && (
        <div className="flex items-center justify-between pt-1 border-t border-smoke">
          <button
            onClick={onToggleCommit}
            className={`text-xs font-bold uppercase tracking-wide transition-colors ${
              committed
                ? 'text-brand-red hover:text-red-700'
                : 'text-steel hover:text-ink'
            }`}
          >
            {committed ? 'Committed ✓' : 'Commit'}
          </button>
          {committed && session.otherCommitted.length > 0 && (
            <button
              onClick={onToggleRoster}
              className="text-xs text-ash hover:text-ink transition-colors"
            >
              +{session.committedCount - 1} others
            </button>
          )}
          {!committed && session.committedCount > 0 && (
            <span className="text-xs text-ash">{session.committedCount} going</span>
          )}
        </div>
      )}

      {expanded && committed && session.otherCommitted.length > 0 && (
        <div className="pt-2 border-t border-smoke flex flex-col gap-1.5">
          {session.otherCommitted.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <BeltBadge belt={s.belt as Belt} stripes={0} />
              <span className="text-xs text-ink">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
