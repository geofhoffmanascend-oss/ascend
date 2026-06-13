import { NextResponse } from 'next/server'
import { requireTableOperator } from '@/lib/tableAuth'
import prisma from '@/lib/database'

// DELETE /api/tables/[id]/assign/[userId] — revoke an assignment. Manager-only.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  const { error, caps } = await requireTableOperator(id)
  if (error) return error
  if (!caps!.isManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.matchTableAssignment.deleteMany({ where: { tableId: id, userId } })
  return NextResponse.json({ ok: true })
}
