'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { type Filters } from './ScheduleFilters'
import { classTypeToGroup } from '@/lib/classGroups'

type MonthSession = {
  id: string
  date: string
  cancelled: boolean
  myCommitment: boolean
  class: { title: string; startTime: string; type: string; programId: string | null }
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Returns offset for Monday-start calendar (Mon=0 … Sun=6)
function mondayOffset(date: Date) {
  return (date.getUTCDay() + 6) % 7
}

function timeBucket(time: string): 'am' | 'noon' | 'pm' {
  const h = parseInt(time.split(':')[0], 10)
  if (h < 12) return 'am'
  if (h < 14) return 'noon'
  return 'pm'
}

export function MonthCalendar({
  sessions,
  currentMonth,
  filters,
  blockedClassGroups = [],
  blockedProgramIds = [],
}: {
  sessions: MonthSession[]
  currentMonth: string
  filters: Filters
  blockedClassGroups?: string[]
  blockedProgramIds?: string[]
}) {
  const router = useRouter()

  // A session is blocked (access-restricted) when its class group or program is
  // on the user's blocked list — gray it out to match the week/day views.
  function isBlocked(s: MonthSession) {
    const group = classTypeToGroup(s.class.type)
    return (group !== null && blockedClassGroups.includes(group)) ||
      (!!s.class.programId && blockedProgramIds.includes(s.class.programId))
  }

  const [year, monthNum] = currentMonth.split('-').map(Number)
  const firstDay = new Date(Date.UTC(year, monthNum - 1, 1))
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const monthLabel = firstDay.toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  })

  function prevMonth() {
    const d = new Date(Date.UTC(year, monthNum - 2, 1))
    router.push(`/schedule?view=month&month=${d.toISOString().slice(0, 7)}`)
  }

  function nextMonth() {
    const d = new Date(Date.UTC(year, monthNum, 1))
    router.push(`/schedule?view=month&month=${d.toISOString().slice(0, 7)}`)
  }

  // Group sessions by date string, applying filters (open_mat always included)
  const byDate: Record<string, MonthSession[]> = {}
  for (const s of sessions) {
    const isOpenMat = s.class.type === 'open_mat'
    if (!isOpenMat) {
      if (!filters.types.includes(s.class.type)) continue
      if (!filters.times.includes(timeBucket(s.class.startTime))) continue
    }
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
  }

  // Build flat array of cells (null = padding day outside the month)
  const leadingBlanks = mondayOffset(firstDay)
  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      `${currentMonth}-${String(i + 1).padStart(2, '0')}`
    ),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={prevMonth}
          className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm font-medium text-ink min-w-36 text-center">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="px-3 py-1.5 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-smoke mb-px">
        {DAY_HEADERS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-widest text-steel">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border-l border-t border-smoke">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((dateStr, di) => {
              if (!dateStr) {
                return <div key={di} className="border-r border-b border-smoke bg-mist/40 min-h-24" />
              }
              const daySessions = byDate[dateStr] ?? []
              const today = dateStr === todayStr
              const dayNum = parseInt(dateStr.split('-')[2])
              const hasCommitted = daySessions.some(s => s.myCommitment)

              return (
                <Link
                  key={dateStr}
                  href={`/schedule/${dateStr}`}
                  className={`border-r border-b border-smoke min-h-24 p-1.5 flex flex-col hover:bg-mist/50 transition-colors ${today ? 'bg-brand-red/5' : 'bg-paper'}`}
                >
                  <span className={`text-xs font-bold mb-1 self-start w-5 h-5 flex items-center justify-center rounded-full ${
                    today ? 'bg-brand-red text-paper' : 'text-steel'
                  }`}>
                    {dayNum}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {daySessions.slice(0, 3).map(s => (
                      <div
                        key={s.id}
                        className={`px-1 py-0.5 text-xs truncate leading-tight rounded-sm ${
                          s.cancelled
                            ? 'bg-smoke text-ash line-through'
                            : s.myCommitment
                            ? 'bg-brand-red/10 text-brand-red font-medium'
                            : 'bg-mist text-steel'
                        } ${isBlocked(s) ? 'opacity-40' : ''}`}
                      >
                        <span className="hidden sm:inline">{s.class.startTime} </span>
                        {s.class.title}
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <span className="text-xs text-ash pl-1">+{daySessions.length - 3} more</span>
                    )}
                  </div>
                  {hasCommitted && daySessions.length === 0 && null}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-brand-red/10 border border-brand-red/20" />
          <span className="text-xs text-ash">Committed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-mist" />
          <span className="text-xs text-ash">Open</span>
        </div>
      </div>
    </div>
  )
}
