import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'
import { randomBytes } from 'crypto'

// POST /api/admin/tournaments/[id]/matches/[matchId]/table
// Send a bracket match to a live match-console table. Idempotent: if the match
// already has a table, returns it. Body: { rulesetId?, periodMs?, label? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId, matchId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { gymId: true, title: true },
  })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: { division: { select: { tournamentId: true } } },
  })
  if (!match || match.division.tournamentId !== tournamentId) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }
  if (!match.participantA || !match.participantB) {
    return NextResponse.json({ error: 'Both competitors must be set before sending to a table' }, { status: 400 })
  }

  // already linked? return existing
  const existing = await prisma.matchTable.findUnique({ where: { tournamentMatchId: matchId } })
  if (existing) return NextResponse.json({ table: { id: existing.id, publicSlug: existing.publicSlug } })

  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: match.participantA }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: match.participantB }, select: { name: true } }),
  ])

  const body = await req.json().catch(() => ({}))
  const ruleset = getRuleset(body?.rulesetId) ?? getRuleset('ibjjf_gi')!
  const periodMs = Number.isFinite(body?.periodMs) && body.periodMs > 0
    ? Math.min(Math.round(body.periodMs), 60 * 60_000)
    : ruleset.periodMs
  const label = (body?.label ?? '').toString().trim() || `R${match.round + 1} · Match ${match.position + 1}`

  const table = await prisma.matchTable.create({
    data: {
      gymId,
      tournamentId,
      tournamentMatchId: matchId,
      createdById: session!.user.id,
      label,
      publicSlug: randomBytes(9).toString('base64url'),
      aUserId: match.participantA,
      aName: a?.name ?? 'Competitor A',
      bUserId: match.participantB,
      bName: b?.name ?? 'Competitor B',
      rulesetId: ruleset.id,
      rulesetConfig: { ...ruleset, periodMs },
      clockStatus: 'stopped',
      remainingMs: periodMs,
      periodMs,
      period: 1,
      status: 'idle',
    },
    select: { id: true, publicSlug: true },
  })

  return NextResponse.json({ table }, { status: 201 })
}
