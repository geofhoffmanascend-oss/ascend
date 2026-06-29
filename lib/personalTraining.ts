import { ClassType, DayOfWeek } from '@prisma/client'

// Map any date to the Monday (UTC) of its week, as an ISO yyyy-mm-dd key.
// Matches the gym-attendance streak logic on the dashboard so the two sources union cleanly.
export function weekKey(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

export const DAY_VALUES: DayOfWeek[] = [
  DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.wednesday, DayOfWeek.thursday,
  DayOfWeek.friday, DayOfWeek.saturday, DayOfWeek.sunday,
]

export const CLASS_TYPE_VALUES = Object.values(ClassType)

export const CLASS_TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Competition', seminar: 'Seminar', fundamentals: 'Fundamentals',
  nogi_fundamentals: 'No-Gi Fundamentals', muay_thai: 'Muay Thai', wrestling: 'Wrestling',
  self_defense: 'Self-Defense',
}

export const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

// JS Date.getUTCDay() (0=Sun) -> our DayOfWeek enum value.
export function jsDayToDayOfWeek(jsDay: number): DayOfWeek {
  // jsDay: 0=Sun..6=Sat
  return DAY_VALUES[(jsDay + 6) % 7]
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidTime(v: unknown): v is string {
  return typeof v === 'string' && TIME_RE.test(v)
}

// "18:00" -> "6:00 PM"
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Today's local date as a UTC-midnight Date (for @db.Date storage).
export function todayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}
