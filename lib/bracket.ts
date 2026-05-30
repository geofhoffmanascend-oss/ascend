// Pure bracket generation — no DB calls

export interface MatchSeed {
  round: number
  position: number
  participantA: string | null
  participantB: string | null
  result: 'pending' | 'bye'
}

// Returns the smallest power of 2 >= n
function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function generateSingleElim(participants: string[]): MatchSeed[] {
  const n = participants.length
  if (n < 2) return []

  const size = nextPow2(n)
  const rounds = Math.log2(size)
  const matches: MatchSeed[] = []

  // Standard bracket seeding: 1 vs n, 2 vs n-1, ...
  // Pad with nulls (byes) to fill the bracket
  const seeded: (string | null)[] = [...participants]
  while (seeded.length < size) seeded.push(null)

  // Round 1 matchups: interleave top half and bottom half
  const top = seeded.slice(0, size / 2)
  const bottom = seeded.slice(size / 2).reverse()

  for (let i = 0; i < size / 2; i++) {
    const a = top[i]
    const b = bottom[i]
    const isBye = a === null || b === null
    matches.push({
      round: 1,
      position: i,
      participantA: a,
      participantB: b,
      result: isBye ? 'bye' : 'pending',
    })
  }

  // Create empty placeholder matches for rounds 2..rounds
  for (let r = 2; r <= rounds; r++) {
    const count = size / Math.pow(2, r)
    for (let p = 0; p < count; p++) {
      matches.push({ round: r, position: p, participantA: null, participantB: null, result: 'pending' })
    }
  }

  return matches
}

// Given a completed match (round, position), return the next-round match location
export function nextMatchSlot(round: number, position: number): { round: number; position: number; slot: 'A' | 'B' } {
  return {
    round: round + 1,
    position: Math.floor(position / 2),
    slot: position % 2 === 0 ? 'A' : 'B',
  }
}

export function generateRoundRobin(participants: string[]): MatchSeed[] {
  const matches: MatchSeed[] = []
  let pos = 0
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        round: 1,
        position: pos++,
        participantA: participants[i],
        participantB: participants[j],
        result: 'pending',
      })
    }
  }
  return matches
}

// Compute round-robin standings from match results
export function roundRobinStandings(
  participants: string[],
  matches: { participantA: string | null; participantB: string | null; result: string }[]
): { userId: string; wins: number; losses: number; draws: number; points: number }[] {
  const stats: Record<string, { wins: number; losses: number; draws: number }> = {}
  for (const p of participants) stats[p] = { wins: 0, losses: 0, draws: 0 }

  for (const m of matches) {
    if (!m.participantA || !m.participantB) continue
    if (m.result === 'participant_a_wins') {
      stats[m.participantA].wins++
      stats[m.participantB].losses++
    } else if (m.result === 'participant_b_wins') {
      stats[m.participantB].wins++
      stats[m.participantA].losses++
    } else if (m.result === 'draw') {
      stats[m.participantA].draws++
      stats[m.participantB].draws++
    }
  }

  return participants
    .map(userId => ({
      userId,
      ...stats[userId],
      points: stats[userId].wins * 2 + stats[userId].draws,
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
}
