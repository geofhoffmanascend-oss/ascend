'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WeeklySchedule } from './WeeklySchedule'
import { MonthCalendar } from './MonthCalendar'
import { ScheduleFilters, DEFAULT_FILTERS, type Filters } from './ScheduleFilters'

// ── Types (mirror what page.tsx constructs) ────────────────────────────────────

type Session = {
  id: string; date: string; cancelled: boolean; cancelNote: string | null
  notes: string | null; committedCount: number; myCommitment: { id: string } | null
  myCheckedIn: boolean; otherCommitted: { id: string; name: string; belt: string }[]
  class: { id: string; title: string; type: string; startTime: string; endTime: string; location: string | null; instructorName: string }
}
type Day = { date: string; sessions: Session[] }
type MonthSession = {
  id: string; date: string; cancelled: boolean; myCommitment: boolean; myCheckedIn: boolean
  class: { title: string; startTime: string; type: string }
}

export type { Day, MonthSession, Session }

// ── Helpers ────────────────────────────────────────────────────────────────────

function storageKey(userId: string) {
  return `ascend:schedule-filters:${userId}`
}

function loadFilters(userId: string): Filters {
  if (typeof window === 'undefined') return DEFAULT_FILTERS
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_FILTERS
}

function saveFilters(userId: string, filters: Filters) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(filters))
  } catch {}
}

// ── Period Nav (prev / label / next) ──────────────────────────────────────────

export function PeriodNav({
  label,
  prevUrl,
  nextUrl,
}: {
  label: string
  prevUrl: string
  nextUrl: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={prevUrl}
        className="p-2 border border-smoke text-steel hover:border-steel hover:text-ink transition-colors"
        aria-label="Previous"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>
      <span className="text-sm font-medium text-ink min-w-[140px] text-center">{label}</span>
      <Link
        href={nextUrl}
        className="p-2 border border-smoke text-steel hover:border-steel hover:text-ink transition-colors"
        aria-label="Next"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  )
}

// ── View Toggle ────────────────────────────────────────────────────────────────

export function ViewToggle({
  active,
  todayStr,
  weekStr,
  monthStr,
}: {
  active: 'day' | 'week' | 'month'
  todayStr: string
  weekStr: string
  monthStr: string
}) {
  const base = 'px-3 py-1.5 text-sm font-bold transition-colors'
  const on = `${base} bg-brand-red text-paper`
  const off = `${base} border border-smoke text-steel hover:border-steel hover:text-ink`
  return (
    <div className="flex gap-1">
      <Link href={`/schedule/${todayStr}`} className={active === 'day' ? on : off}>Day</Link>
      <Link href={`/schedule?view=week&week=${weekStr}`} className={active === 'week' ? on : off}>Week</Link>
      <Link href={`/schedule?view=month&month=${monthStr}`} className={active === 'month' ? on : off}>Month</Link>
    </div>
  )
}

// ── Shell ──────────────────────────────────────────────────────────────────────

type Props = {
  userId: string
  view: 'week' | 'month'
  todayStr: string
  weekStr: string
  monthStr: string
  prevUrl: string
  nextUrl: string
  periodLabel: string
  blockedClassGroups?: string[]
  blockedProgramIds?: string[]
  // week
  days?: Day[]
  currentMonday?: string
  // month
  monthSessions?: MonthSession[]
  currentMonth?: string
}

export function ScheduleShell({
  userId, view,
  todayStr, weekStr, monthStr,
  prevUrl, nextUrl, periodLabel,
  blockedClassGroups = [],
  blockedProgramIds = [],
  days, currentMonday,
  monthSessions, currentMonth,
}: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setFilters(loadFilters(userId))
    setReady(true)
  }, [userId])

  useEffect(() => {
    if (ready) saveFilters(userId, filters)
  }, [userId, filters, ready])

  function handleChange(f: Filters) {
    setFilters(f)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <ViewToggle active={view} todayStr={todayStr} weekStr={weekStr} monthStr={monthStr} />
        <ScheduleFilters filters={filters} onChange={handleChange} />
      </div>
      <div className="flex justify-center mb-6">
        <PeriodNav prevUrl={prevUrl} nextUrl={nextUrl} label={periodLabel} />
      </div>

      {view === 'week' && days && currentMonday && (
        <WeeklySchedule days={days} currentMonday={currentMonday} filters={filters} blockedClassGroups={blockedClassGroups} blockedProgramIds={blockedProgramIds} />
      )}
      {view === 'month' && monthSessions && currentMonth && (
        <MonthCalendar sessions={monthSessions} currentMonth={currentMonth} filters={filters} />
      )}
    </div>
  )
}
