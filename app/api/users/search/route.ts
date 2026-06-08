import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  // Scope DM/tag search to the searcher's own gym (multi-tenancy). Cross-gym
  // reach is reserved for public forums, events, and private-instructor search.
  const gymId = session.user.gymId ?? null

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      gymId,
      name: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, name: true, avatarUrl: true, roles: true, belt: true },
    take: 10,
  })

  return NextResponse.json(users)
}
