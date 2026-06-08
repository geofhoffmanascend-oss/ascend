// Phase 42 — private-lesson availability slot computation. Pure (no prisma) so
// it's easy to test; callers pass in the instructor's availability rows + their
// booked lessons. Times are wall-clock "HH:mm" strings handled in UTC minutes,
// matching the rest of the app's loose time handling (no TZ conversion).

export type Interval = { start: number; end: number } // minutes since midnight

export type AvailabilityEntry = {
  kind: 'recurring' | 'oneoff' | 'block'
  dayOfWeek: string | null
  date: Date | string | null
  startTime: string
  endTime: string
}

export type BookedLesson = { scheduledAt: Date | string; durationMins: number }

const DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function asDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function sameUTCDate(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate()
}

function merge(intervals: Interval[]): Interval[] {
  const s = intervals.filter(i => i.end > i.start).sort((a, b) => a.start - b.start)
  const out: Interval[] = []
  for (const i of s) {
    const last = out[out.length - 1]
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end)
    else out.push({ ...i })
  }
  return out
}

// base minus cut (handles partial overlaps, splitting intervals)
function subtract(base: Interval[], cut: Interval[]): Interval[] {
  let result = merge(base)
  for (const c of merge(cut)) {
    const next: Interval[] = []
    for (const b of result) {
      if (c.end <= b.start || c.start >= b.end) { next.push(b); continue }
      if (c.start > b.start) next.push({ start: b.start, end: c.start })
      if (c.end < b.end) next.push({ start: c.end, end: b.end })
    }
    result = next
  }
  return result
}

export function bookedIntervalsForDate(lessons: BookedLesson[], date: Date): Interval[] {
  return lessons
    .filter(l => sameUTCDate(asDate(l.scheduledAt), date))
    .map(l => {
      const d = asDate(l.scheduledAt)
      const start = d.getUTCHours() * 60 + d.getUTCMinutes()
      return { start, end: start + (l.durationMins || 60) }
    })
}

// Free availability windows for one UTC date: (recurring∪one-off) − (blocks∪booked).
export function freeIntervalsForDate(entries: AvailabilityEntry[], bookedIntervals: Interval[], date: Date): Interval[] {
  const dow = DOW[date.getUTCDay()]
  const base: Interval[] = []
  const blocks: Interval[] = []
  for (const e of entries) {
    const iv = { start: toMin(e.startTime), end: toMin(e.endTime) }
    if (e.kind === 'recurring' && e.dayOfWeek === dow) base.push(iv)
    else if (e.kind === 'oneoff' && e.date && sameUTCDate(asDate(e.date), date)) base.push(iv)
    else if (e.kind === 'block' && e.date && sameUTCDate(asDate(e.date), date)) blocks.push(iv)
  }
  if (base.length === 0) return []
  return subtract(base, [...blocks, ...bookedIntervals])
}

// Discrete bookable start times (HH:mm) of slotMinutes that fit in the free windows.
export function slotsFromIntervals(intervals: Interval[], slotMinutes = 60, stepMinutes = slotMinutes): string[] {
  const slots: string[] = []
  for (const iv of intervals) {
    for (let s = iv.start; s + slotMinutes <= iv.end; s += stepMinutes) slots.push(minToHHMM(s))
  }
  return slots
}

export type DayAvailability = { date: string; intervals: Interval[]; slots: string[] }

// Availability across a UTC date range. Skips dates with no availability.
export function availabilityInRange(
  entries: AvailabilityEntry[],
  lessons: BookedLesson[],
  from: Date,
  to: Date,
  slotMinutes = 60,
): DayAvailability[] {
  const out: DayAvailability[] = []
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))
  while (d <= end) {
    const booked = bookedIntervalsForDate(lessons, d)
    const free = freeIntervalsForDate(entries, booked, d)
    if (free.length) {
      out.push({ date: d.toISOString().split('T')[0], intervals: free, slots: slotsFromIntervals(free, slotMinutes) })
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}
