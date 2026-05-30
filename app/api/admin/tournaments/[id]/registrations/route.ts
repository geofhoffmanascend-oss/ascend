import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { gymId: true } })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const registrations = await prisma.registration.findMany({
    where: { division: { tournamentId } },
    include: {
      user: { select: { id: true, name: true, belt: true, stripes: true } },
      division: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ registrations })
}
