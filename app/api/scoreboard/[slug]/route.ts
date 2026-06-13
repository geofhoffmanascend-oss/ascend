import { NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { computeScore } from '@/lib/matchScore'

// GET /api/scoreboard/[slug] — PUBLIC read-only state for the scoreboard display.
// No auth (middleware allows /api/scoreboard). Minimal payload + serverNow for skew.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const table = await prisma.matchTable.findUnique({
    where: { publicSlug: slug },
    include: { events: true },
  })
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const score = computeScore(table.events)

  return NextResponse.json({
    serverNow: Date.now(),
    label: table.label,
    status: table.status,
    aName: table.aName,
    aClub: table.aClub,
    bName: table.bName,
    bClub: table.bClub,
    rulesetId: table.rulesetId,
    clockStatus: table.clockStatus,
    remainingMs: table.remainingMs,
    anchorTs: table.anchorTs == null ? null : Number(table.anchorTs),
    period: table.period,
    winnerSide: table.winnerSide,
    winBy: table.winBy,
    score,
  })
}
