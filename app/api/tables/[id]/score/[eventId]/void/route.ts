import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'

// POST /api/tables/[id]/score/[eventId]/void — correction: void an event (kept for audit).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params
  const { error, caps } = await requireTableOperator(id)
  if (error) return error
  if (!caps!.canScore) return NextResponse.json({ error: 'No scoring permission' }, { status: 403 })

  const event = await prisma.matchScoreEvent.findUnique({ where: { id: eventId } })
  if (!event || event.tableId !== id) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  await prisma.matchScoreEvent.update({ where: { id: eventId }, data: { voided: !event.voided } })
  return NextResponse.json({ ok: true })
}
