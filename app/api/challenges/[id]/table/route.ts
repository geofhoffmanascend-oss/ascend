import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'
import { randomBytes } from 'crypto'

// POST /api/challenges/[id]/table — spawn a Phase 58 console table for a scheduled
// challenge. Host gym admin / site_admin only. Idempotent.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const c = await prisma.challengeMatch.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, name: true } },
      challenged: { select: { id: true, name: true } },
    },
  })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const roles = session.user.roles ?? []
  const isHostAdmin = roles.includes('admin') && !!c.hostGymId && session.user.gymId === c.hostGymId
  if (!isHostAdmin && !roles.includes('site_admin')) {
    return NextResponse.json({ error: 'Only the host gym admin can start the match' }, { status: 403 })
  }
  if (c.status !== 'scheduled') return NextResponse.json({ error: 'Challenge is not scheduled' }, { status: 409 })

  const existing = await prisma.matchTable.findFirst({ where: { challengeId: id } })
  if (existing) return NextResponse.json({ table: { id: existing.id, publicSlug: existing.publicSlug } })

  const ruleset = getRuleset(c.rulesetId) ?? getRuleset('ibjjf_gi')!
  const periodMs = c.periodMs ?? ruleset.periodMs

  const table = await prisma.matchTable.create({
    data: {
      gymId: c.hostGymId,
      challengeId: id,
      createdById: session.user.id,
      label: 'Challenge Match',
      publicSlug: randomBytes(9).toString('base64url'),
      aUserId: c.challengerId,
      aName: c.challenger.name ?? 'Challenger',
      bUserId: c.challengedId,
      bName: c.challenged.name ?? 'Challenged',
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
