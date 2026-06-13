import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'

const MAX_MS = 60 * 60_000

// POST /api/tables/[id]/clock — timekeeper-stamped clock control.
// Body: { action: 'start'|'stop'|'adjust'|'period', anchorTs?, remainingMs?, period? }
// The timekeeper's client stamps the press instant (anchorTs, in server time) and
// the recomputed remainingMs; the server stores them verbatim so network latency
// never shifts the recorded time.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, session, table, caps } = await requireTableOperator(id)
  if (error) return error
  if (!caps!.canTime) return NextResponse.json({ error: 'No timekeeper permission' }, { status: 403 })
  if (table!.status === 'done') return NextResponse.json({ error: 'Match is finished' }, { status: 409 })

  const body = await req.json().catch(() => null)
  const action = body?.action as string
  const clampMs = (v: unknown) => Math.max(0, Math.min(Math.round(Number(v) || 0), MAX_MS))

  if (action === 'start') {
    const anchorTs = BigInt(Math.round(Number(body.anchorTs) || Date.now()))
    await prisma.matchTable.update({
      where: { id },
      data: {
        clockStatus: 'running',
        anchorTs,
        remainingMs: clampMs(body.remainingMs ?? table!.remainingMs),
        status: 'live',
      },
    })
  } else if (action === 'stop') {
    await prisma.matchTable.update({
      where: { id },
      data: {
        clockStatus: 'stopped',
        anchorTs: null,
        remainingMs: clampMs(body.remainingMs ?? table!.remainingMs),
        status: table!.status === 'idle' ? 'idle' : 'paused',
      },
    })
  } else if (action === 'adjust') {
    const remainingMs = clampMs(body.remainingMs)
    const running = table!.clockStatus === 'running'
    await prisma.matchTable.update({
      where: { id },
      data: {
        remainingMs,
        // re-anchor if currently running so the new value takes effect from now
        anchorTs: running ? BigInt(Math.round(Number(body.anchorTs) || Date.now())) : table!.anchorTs,
      },
    })
    await prisma.matchScoreEvent.create({
      data: {
        tableId: id, type: 'clock_adjust', byUserId: session!.user.id,
        meta: { from: table!.remainingMs, to: remainingMs },
      },
    })
  } else if (action === 'period') {
    const nextPeriod = table!.period + 1
    await prisma.matchTable.update({
      where: { id },
      data: {
        period: nextPeriod,
        clockStatus: 'stopped',
        anchorTs: null,
        remainingMs: table!.periodMs,
      },
    })
    await prisma.matchScoreEvent.create({
      data: { tableId: id, type: 'note', byUserId: session!.user.id, meta: { period: nextPeriod } },
    })
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, serverNow: Date.now() })
}
