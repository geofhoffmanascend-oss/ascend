import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'
import { randomBytes } from 'crypto'

// GET /api/tables — tables the current user can operate (created or assigned).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tables = await prisma.matchTable.findMany({
    where: {
      OR: [
        { createdById: session.user.id },
        { assignments: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, label: true, status: true, publicSlug: true,
      aName: true, bName: true, rulesetId: true, winnerSide: true, createdAt: true,
    },
  })
  return NextResponse.json({ tables })
}

// POST /api/tables — create a standalone match table.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const label = (body.label ?? '').toString().trim()
  const aName = (body.aName ?? '').toString().trim()
  const bName = (body.bName ?? '').toString().trim()
  if (!label || !aName || !bName) {
    return NextResponse.json({ error: 'Label and both competitor names are required' }, { status: 400 })
  }

  const ruleset = getRuleset(body.rulesetId)
  if (!ruleset) return NextResponse.json({ error: 'Unknown ruleset' }, { status: 400 })

  const periodMs = Number.isFinite(body.periodMs) && body.periodMs > 0
    ? Math.min(Math.round(body.periodMs), 60 * 60_000) // cap 60 min
    : ruleset.periodMs

  const table = await prisma.matchTable.create({
    data: {
      gymId: session.user.gymId ?? null,
      createdById: session.user.id,
      label,
      publicSlug: randomBytes(9).toString('base64url'),
      aName,
      aClub: (body.aClub ?? '').toString().trim() || null,
      bName,
      bClub: (body.bClub ?? '').toString().trim() || null,
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
