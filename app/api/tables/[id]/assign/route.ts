import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'

// POST /api/tables/[id]/assign — grant scorer/timer to a user. Manager-only.
// Body: { userId, canScore?, canTime? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, caps } = await requireTableOperator(id)
  if (error) return error
  if (!caps!.isManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const userId = (body?.userId ?? '').toString()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const assignment = await prisma.matchTableAssignment.upsert({
    where: { tableId_userId: { tableId: id, userId } },
    update: { canScore: body?.canScore ?? true, canTime: body?.canTime ?? true },
    create: { tableId: id, userId, canScore: body?.canScore ?? true, canTime: body?.canTime ?? true },
  })

  return NextResponse.json({ ok: true, assignment: { userId, name: user.name, canScore: assignment.canScore, canTime: assignment.canTime } })
}
