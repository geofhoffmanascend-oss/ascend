import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gymId = session.user.gymId ?? null

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ['open', 'in_progress', 'complete'] },
      OR: [
        { isPublic: true },
        ...(gymId ? [{ gymId }] : []),
      ],
    },
    include: {
      gym: { select: { name: true, slug: true } },
      _count: { select: { divisions: true } },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json({ tournaments })
}
