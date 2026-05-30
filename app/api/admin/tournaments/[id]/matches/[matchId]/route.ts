import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { MatchResult } from '@prisma/client'
import { nextMatchSlot } from '@/lib/bracket'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId, matchId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { gymId: true, format: true },
  })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { result, notes } = await req.json()
  const validResults: MatchResult[] = ['participant_a_wins', 'participant_b_wins', 'draw', 'bye']
  if (!validResults.includes(result)) return NextResponse.json({ error: 'Invalid result' }, { status: 400 })

  const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { result: result as MatchResult, notes: notes?.trim() || null },
  })

  // For single_elim: propagate winner to next round
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
        // This was the final match — mark tournament complete
        await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'complete' } })
      }
    }
  }

  // For round_robin: check if all matches complete
  if (tournament.format === 'round_robin') {
    const pending = await prisma.tournamentMatch.count({
      where: { division: { tournamentId }, result: 'pending' },
    })
    if (pending === 0) {
      await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'complete' } })
    }
  }

  const updated = await prisma.tournamentMatch.findUnique({ where: { id: matchId } })
  return NextResponse.json({ match: updated })
}
