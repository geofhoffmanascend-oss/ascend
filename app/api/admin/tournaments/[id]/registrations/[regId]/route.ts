import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId, regId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { gymId: true } })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { confirmed } = await req.json()

  const registration = await prisma.registration.update({
    where: { id: regId },
    data: { confirmed: !!confirmed },
  })

  return NextResponse.json({ registration })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId, regId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { gymId: true } })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.registration.delete({ where: { id: regId } })
  return NextResponse.json({ ok: true })
}
