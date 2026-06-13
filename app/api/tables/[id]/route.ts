import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'
import { computeScore } from '@/lib/matchScore'

// GET /api/tables/[id] — full control-screen state (includes serverNow for skew correction).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, table, caps } = await requireTableOperator(id)
  if (error) return error

  const events = await prisma.matchScoreEvent.findMany({
    where: { tableId: id },
    orderBy: { createdAt: 'desc' },
  })

  const score = computeScore(events)

  return NextResponse.json({
    serverNow: Date.now(),
    caps,
    table: {
      id: table!.id,
      label: table!.label,
      status: table!.status,
      publicSlug: table!.publicSlug,
      aName: table!.aName,
      aClub: table!.aClub,
      bName: table!.bName,
      bClub: table!.bClub,
      rulesetId: table!.rulesetId,
      rulesetConfig: table!.rulesetConfig,
      clockStatus: table!.clockStatus,
      remainingMs: table!.remainingMs,
      anchorTs: table!.anchorTs == null ? null : Number(table!.anchorTs),
      periodMs: table!.periodMs,
      period: table!.period,
      winnerSide: table!.winnerSide,
      winBy: table!.winBy,
    },
    score,
    events: events.map(e => ({
      id: e.id, side: e.side, type: e.type, value: e.value,
      voided: e.voided, meta: e.meta, createdAt: e.createdAt,
    })),
  })
}
