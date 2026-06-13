// Applies a result to a TournamentMatch and propagates it through the bracket.
// Shared by the manual admin result editor (PUT match route) and the live match
// console (Phase 58 — table Finish writes the winner back into the bracket).

import prisma from './database'
import { nextMatchSlot } from './bracket'
import type { MatchResult } from '@prisma/client'

export async function applyTournamentMatchResult(opts: {
  tournamentId: string
  matchId: string
  result: MatchResult
  notes?: string | null
}) {
  const { tournamentId, matchId, result, notes } = opts

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true },
  })
  if (!tournament) return null

  const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } })
  if (!match) return null

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { result, ...(notes !== undefined ? { notes: notes?.trim() || null } : {}) },
  })

  // single_elim: propagate the winner into the next round (or complete the tournament)
  if (tournament.format === 'single_elim') {
    const winnerId = result === 'participant_a_wins' || result === 'bye'
      ? match.participantA
      : result === 'participant_b_wins'
      ? match.participantB
      : null

    if (winnerId) {
      const { round: nextRound, position: nextPos, slot } = nextMatchSlot(match.round, match.position)
      const nextMatch = await prisma.tournamentMatch.findFirst({
        where: { divisionId: match.divisionId, round: nextRound, position: nextPos },
      })
      if (nextMatch) {
        await prisma.tournamentMatch.update({
          where: { id: nextMatch.id },
          data: slot === 'A' ? { participantA: winnerId } : { participantB: winnerId },
        })
      } else {
        // final match — mark the tournament complete
        await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'complete' } })
      }
    }
  }

  // round_robin: complete the tournament once no matches remain pending
  if (tournament.format === 'round_robin') {
    const pending = await prisma.tournamentMatch.count({
      where: { division: { tournamentId }, result: 'pending' },
    })
    if (pending === 0) {
      await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'complete' } })
    }
  }

  return prisma.tournamentMatch.findUnique({ where: { id: matchId } })
}
