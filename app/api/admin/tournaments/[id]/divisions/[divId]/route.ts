import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; divId: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId, divId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { gymId: true } })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const confirmed = await prisma.registration.count({ where: { divisionId: divId, confirmed: true } })
  if (confirmed > 0) return NextResponse.json({ error: 'Cannot delete a division with confirmed registrations' }, { status: 400 })

  await prisma.division.delete({ where: { id: divId } })
  return NextResponse.json({ ok: true })
}
