// Phase 58 — score reduction + clock state serialization shared by the control
// API (GET /api/tables/[id]) and the public scoreboard (GET /api/scoreboard/[slug]).

export type ScoreEvent = {
  id: string
  side: string | null
  type: string
  value: number
  voided: boolean
  byUserId: string
  meta: unknown
  createdAt: Date
}

export type SideScore = { points: number; advantages: number; penalties: number }

const EMPTY: SideScore = { points: 0, advantages: 0, penalties: 0 }

// Current score = reduce non-voided events per side. Points/advantages/penalties
// are tracked separately (IBJJF/ADCC tiebreak order: points → advantages → fewest penalties).
export function computeScore(events: ScoreEvent[]): { a: SideScore; b: SideScore } {
  const a: SideScore = { ...EMPTY }
  const b: SideScore = { ...EMPTY }
  for (const e of events) {
    if (e.voided) continue
    const bucket = e.side === 'a' ? a : e.side === 'b' ? b : null
    if (!bucket) continue
    if (e.type === 'points') bucket.points += e.value
    else if (e.type === 'advantage') bucket.advantages += e.value
    else if (e.type === 'penalty') bucket.penalties += e.value
  }
  return { a, b }
}

// Derive displayed remaining ms for a given server-now estimate. Mirrors the
// client-side interpolation so a fresh GET and a polling client agree.
export function deriveRemainingMs(
  clockStatus: string,
  remainingMs: number,
  anchorTs: bigint | null,
  estServerNow: number,
): number {
  if (clockStatus !== 'running' || anchorTs == null) return Math.max(0, remainingMs)
  const elapsed = estServerNow - Number(anchorTs)
  return Math.max(0, remainingMs - elapsed)
}

export function fmtClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
