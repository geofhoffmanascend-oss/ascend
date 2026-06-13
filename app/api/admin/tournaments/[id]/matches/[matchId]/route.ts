import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { MatchResult } from '@prisma/client'
import { applyTournamentMatchResult } from '@/lib/tournamentResult'

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
    select: { gymId: true },
  })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { result, notes } = await req.json()
  const validResults: MatchResult[] = ['participant_a_wins', 'participant_b_wins', 'draw', 'bye']
  if (!validResults.includes(result)) return NextResponse.json({ error: 'Invalid result' }, { status: 400 })

  const updated = await applyTournamentMatchResult({ tournamentId, matchId, result, notes })
  if (!updated) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  return NextResponse.json({ match: updated })
}
