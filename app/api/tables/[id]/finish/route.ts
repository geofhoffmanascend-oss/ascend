import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'
import { applyTournamentMatchResult } from '@/lib/tournamentResult'
import { applyChallengeResult } from '@/lib/challenge'
import type { MatchResult } from '@prisma/client'

const WIN_BY = ['submission', 'points', 'decision', 'dq', 'forfeit', 'draw']

// POST /api/tables/[id]/finish — set winner + close the table.
// Body: { winnerSide: 'a'|'b'|null, winBy }
// Phase 58 M2: if this table is linked to a bracket match, write the winner back
// into TournamentMatch.result and propagate through the bracket.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, session, table, caps } = await requireTableOperator(id)
  if (error) return error
  if (!caps!.canScore) return NextResponse.json({ error: 'Not permitted to finish' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const winnerSide = body?.winnerSide === 'a' || body?.winnerSide === 'b' ? body.winnerSide : null
  const winBy = WIN_BY.includes(body?.winBy) ? body.winBy : (winnerSide ? 'decision' : 'draw')

  await prisma.matchTable.update({
    where: { id },
    data: {
      status: 'done',
      clockStatus: 'stopped',
      anchorTs: null,
      winnerSide,
      winBy,
    },
  })
  await prisma.matchScoreEvent.create({
    data: { tableId: id, type: 'win', side: winnerSide, byUserId: session!.user.id, meta: { winBy } },
  })

  // Propagate to the bracket if this table runs a tournament match.
  if (table!.tournamentId && table!.tournamentMatchId) {
    const result: MatchResult = winnerSide === 'a' ? 'participant_a_wins'
      : winnerSide === 'b' ? 'participant_b_wins'
      : 'draw'
    await applyTournamentMatchResult({
      tournamentId: table!.tournamentId,
      matchId: table!.tournamentMatchId,
      result,
      notes: winnerSide ? `Console: by ${winBy}` : 'Console: draw',
    })
  }

  // Propagate to the challenge record if this table runs a challenge match.
  if (table!.challengeId) {
    const winnerId = winnerSide === 'a' ? table!.aUserId
      : winnerSide === 'b' ? table!.bUserId
      : null
    await applyChallengeResult({ challengeId: table!.challengeId, winnerId, winBy })
  }

  return NextResponse.json({ ok: true })
}
