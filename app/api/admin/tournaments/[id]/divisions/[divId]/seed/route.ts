import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { generateSingleElim, generateRoundRobin } from '@/lib/bracket'
import { MatchResult } from '@prisma/client'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; divId: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId, divId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { gymId: true, format: true } })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (tournament.format === 'double_elim') {
    return NextResponse.json({ error: 'Double elimination bracket generation is not yet available.' }, { status: 400 })
  }

  // Check no results entered yet (idempotent guard)
  const existingResults = await prisma.tournamentMatch.count({
    where: { divisionId: divId, result: { not: 'pending' } },
  })
  if (existingResults > 0) {
    return NextResponse.json({ error: 'Cannot re-seed after results have been entered.' }, { status: 400 })
  }

  const registrations = await prisma.registration.findMany({
    where: { divisionId: divId, confirmed: true },
    orderBy: { seed: 'asc' },
  })

  if (registrations.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 confirmed participants to generate brackets.' }, { status: 400 })
  }

  const participants = registrations.map(r => r.userId)
  const seeds = tournament.format === 'round_robin'
    ? generateRoundRobin(participants)
    : generateSingleElim(participants)

  // Clear existing matches for this division
  await prisma.tournamentMatch.deleteMany({ where: { divisionId: divId } })

  // Create new matches
  await prisma.tournamentMatch.createMany({
    data: seeds.map(s => ({
      divisionId: divId,
      round: s.round,
      position: s.position,
      participantA: s.participantA,
      participantB: s.participantB,
      result: s.result as MatchResult,
    })),
  })

  // Assign seeds to registrations
  for (let i = 0; i < registrations.length; i++) {
    await prisma.registration.update({
      where: { id: registrations[i].id },
      data: { seed: i + 1 },
    })
  }

  const matches = await prisma.tournamentMatch.findMany({
    where: { divisionId: divId },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
  })

  return NextResponse.json({ matches })
}
