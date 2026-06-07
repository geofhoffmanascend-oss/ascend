'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BeltBadge } from '@/app/components/BeltBadge'
import { type Filters } from './ScheduleFilters'
import { classTypeToGroup, GROUP_LABELS } from '@/lib/classGroups'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

type Session = {
  id: string
  date: string
  cancelled: boolean
  cancelNote: string | null
  notes: string | null
  committedCount: number
  myCommitment: { id: string } | null
  myCheckedIn: boolean
  otherCommitted: { id: string; name: string; belt: string }[]
  class: {
    id: string
    title: string
    type: string
    programId?: string | null
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
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Basics (Gi)',
  nogi_fundamentals: 'Basics (No-Gi)', muay_thai: 'Muay Thai',
  wrestling: 'Wrestling', self_defense: 'Self Defense',
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

function timeBucket(time: string): 'am' | 'noon' | 'pm' {
  const h = parseInt(time.split(':')[0], 10)
  if (h < 10) return 'am'
  if (h < 14) return 'noon'
  return 'pm'
}

function applyFilters(sessions: Session[], filters: Filters): Session[] {
  return sessions.filter(s =>
    filters.types.includes(s.class.type) && filters.times.includes(timeBucket(s.class.startTime))
  )
}

type SlotGroup = { label: string; sessions: Session[] }

function groupBySlot(sessions: Session[], isWeekend: boolean): SlotGroup[] {
  if (isWeekend) {
    const map = new Map<string, Session[]>()
    sessions.forEach(s => {
      const g = classTypeToGroup(s.class.type)
      const label = g ? GROUP_LABELS[g] : 'Other'
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(s)
    })
    return Array.from(map.entries()).map(([label, sessions]) => ({ label, sessions }))
  }

  const competition = sessions.filter(s => s.class.type === 'competition_prep')
  const rest = sessions.filter(s => s.class.type !== 'competition_prep')
  const am   = rest.filter(s => timeBucket(s.class.startTime) === 'am')
  const noon = rest.filter(s => timeBucket(s.class.startTime) === 'noon')
  const pm   = rest.filter(s => timeBucket(s.class.startTime) === 'pm')

  const groups: SlotGroup[] = []
  if (am.length)          groups.push({ label: '6am', sessions: am })
  if (noon.length)        groups.push({ label: 'Noon', sessions: noon })
  if (pm.length)          groups.push({ label: 'PM', sessions: pm })
  if (competition.length) groups.push({ label: 'Comp', sessions: competition })
  return groups
}

export function WeeklySchedule({ days, currentMonday, filters, blockedClassGroups = [], blockedProgramIds = [] }: { days: Day[]; currentMonday: string; filters: Filters; blockedClassGroups?: string[]; blockedProgramIds?: string[] }) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Record<string, Session>>(() => {
    const map: Record<string, Session> = {}
    days.forEach(d => d.sessions.forEach(s => { map[s.id] = s }))
    return map
  })
  const [expandedRoster, setExpandedRoster] = useState<string | null>(null)

  async function handleCheckin(session: Session) {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classSessionId: session.id }),
    })
    if (res.ok) {
      setSessions(prev => ({ ...prev, [session.id]: { ...prev[session.id], myCheckedIn: true } }))
    }
  }

  function isInCheckinWindow(dateStr: string, _startTime: string): boolean {
    const classDay = new Date(dateStr)
    const today = new Date()
    return (
      classDay.getUTCFullYear() === today.getFullYear() &&
      classDay.getUTCMonth() === today.getMonth() &&
      classDay.getUTCDate() === today.getDate()
    )
  }

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

  function renderCard(s: Session) {
    const live = sessions[s.id] ?? s
    const committed = !!live.myCommitment
    const group = classTypeToGroup(live.class.type)
    const isBlocked =
      (group !== null && blockedClassGroups.includes(group)) ||
      (!!live.class.programId && blockedProgramIds.includes(live.class.programId))
    return (
      <SessionCard
        key={s.id}
        session={live}
        committed={committed}
        expanded={expandedRoster === s.id}
        isBlocked={isBlocked}
        onToggleCommit={() => toggleCommit(live)}
        onToggleRoster={() => setExpandedRoster(expandedRoster === s.id ? null : s.id)}
        onCheckin={() => handleCheckin(live)}
        inCheckinWindow={isInCheckinWindow(live.date, live.class.startTime)}
      />
    )
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

      {/* Desktop grid — row-major so classes at the same time align across days.
          Each row is a time slot; a day with no class in that slot leaves a gap. */}
      {(() => {
        const dayGroups = days.map((day, i) => {
          const filtered = applyFilters(day.sessions, filters)
          const isWeekend = i >= 5
          const map = new Map(groupBySlot(filtered, isWeekend).map(g => [g.label, g.sessions]))
          return { day, today: isToday(day.date), map }
        })

        // Ordered list of slot rows present this week (weekday slots first, then weekend type labels).
        const SLOT_ORDER = ['6am', 'Noon', 'PM', 'Comp']
        const present = new Set<string>()
        dayGroups.forEach(d => d.map.forEach((_v, label) => present.add(label)))
        const rowLabels = [
          ...SLOT_ORDER.filter(l => present.has(l)),
          ...Array.from(present).filter(l => !SLOT_ORDER.includes(l)).sort(),
        ]

        return (
          <div className="hidden md:grid gap-x-2" style={{ gridTemplateColumns: 'minmax(2.5rem, auto) repeat(7, minmax(0, 1fr))' }}>
            {/* Header row */}
            <div />
            {dayGroups.map(({ day, today }, i) => (
              <div key={day.date} className={`mb-2 pb-1 border-b ${today ? 'border-brand-red' : 'border-smoke'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${today ? 'text-brand-red' : 'text-steel'}`}>{DAY_LABELS[i]}</p>
                <p className="text-xs text-ash">{formatDate(day.date)}</p>
              </div>
            ))}

            {rowLabels.length === 0 && (
              <div className="col-span-8 text-xs text-ash italic py-2">No classes this week.</div>
            )}

            {/* Slot rows */}
            {rowLabels.map(label => (
              <Fragment key={label}>
                <div className="text-xs text-ash uppercase tracking-wider pt-2 pr-1 leading-tight">{label}</div>
                {dayGroups.map(({ day, map }) => (
                  <div key={day.date} className="flex flex-col gap-1 pt-2">
                    {(map.get(label) ?? []).map(renderCard)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        )
      })()}

      {/* Mobile list */}
      <div className="md:hidden flex flex-col gap-4">
        {days.map((day, i) => {
          const filtered = applyFilters(day.sessions, filters)
          if (filtered.length === 0) return null
          const today = isToday(day.date)
          const isWeekend = i >= 5
          const groups = groupBySlot(filtered, isWeekend)
          return (
            <div key={day.date}>
              <div className={`mb-2 pb-1 border-b ${today ? 'border-brand-red' : 'border-smoke'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${today ? 'text-brand-red' : 'text-steel'}`}>
                  {DAY_LABELS[i]} · {formatDate(day.date)}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {groups.map(group => (
                  <div key={group.label}>
                    <p className="text-xs text-ash uppercase tracking-wider mt-2 mb-1">{group.label}</p>
                    <div className="flex flex-col gap-2">{group.sessions.map(renderCard)}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

function SessionCard({
  session, committed, expanded, isBlocked, onToggleCommit, onToggleRoster, onCheckin, inCheckinWindow,
}: {
  session: Session
  committed: boolean
  expanded: boolean
  isBlocked: boolean
  onToggleCommit: () => void
  onToggleRoster: () => void
  onCheckin: () => void
  inCheckinWindow: boolean
}) {
  return (
    <div className={`border bg-paper p-3 flex flex-col gap-2 ${isBlocked ? 'opacity-40 border-smoke' : committed ? 'border-l-2 border-l-brand-red border-t-smoke border-r-smoke border-b-smoke' : 'border-smoke'} ${session.cancelled ? 'opacity-60' : ''}`}>
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

      {isBlocked && (
        <p className="text-xs text-ash italic pt-1 border-t border-smoke">Not included in your membership</p>
      )}

      {!session.cancelled && !isBlocked && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-smoke">
          <div className="flex items-center justify-between">
            <button
              onClick={onToggleCommit}
              className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                committed
                  ? 'text-brand-red hover:text-brand-red-dark'
                  : 'text-steel hover:text-ink'
              }`}
            >
              {committed ? 'Registered ✓' : 'Register'}
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
          {committed && inCheckinWindow && (
            session.myCheckedIn ? (
              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Checked In ✓</span>
            ) : (
              <button
                onClick={onCheckin}
                className="text-xs font-bold uppercase tracking-wide text-steel hover:text-brand-red transition-colors"
              >
                Check In
              </button>
            )
          )}
        </div>
      )}

      {expanded && committed && session.otherCommitted.length > 0 && (
        <div className="pt-2 border-t border-smoke flex flex-col gap-1.5">
          {session.otherCommitted.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <BeltBadge belt={s.belt as Belt} stripes={0} />
              <Link href={`/profile/${s.id}`} className="text-xs text-ink hover:text-brand-red transition-colors">{s.name}</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
