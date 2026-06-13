import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'

const ALLOWED = ['points', 'advantage', 'penalty', 'submission', 'disqualification', 'timeout', 'note']

// POST /api/tables/[id]/score — append a score event. Body: { side, type, value, meta? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, session, table, caps } = await requireTableOperator(id)
  if (error) return error
  if (!caps!.canScore) return NextResponse.json({ error: 'No scoring permission' }, { status: 403 })
  if (table!.status === 'done') return NextResponse.json({ error: 'Match is finished' }, { status: 409 })

  const body = await req.json().catch(() => null)
  const type = body?.type as string
  if (!ALLOWED.includes(type)) return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })

  const side = body?.side === 'a' || body?.side === 'b' ? body.side : null
  // side-scoped types must name a competitor
  if (['points', 'advantage', 'penalty'].includes(type) && !side) {
    return NextResponse.json({ error: 'side required' }, { status: 400 })
  }

  const value = Math.max(-10, Math.min(Math.round(Number(body?.value) || 0), 10))

  const event = await prisma.matchScoreEvent.create({
    data: {
      tableId: id,
      side,
      type,
      value,
      byUserId: session!.user.id,
      meta: body?.meta ?? undefined,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, eventId: event.id })
}
