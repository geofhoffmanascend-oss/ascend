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
  // reach is reserved for public forums, events, private-instructor search, and
  // group-chat invites (which pass all=1 to opt into a platform-wide search).
  const all = req.nextUrl.searchParams.get('all') === '1'
  const gymId = session.user.gymId ?? null

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      ...(all ? {} : { gymId }),
      name: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, name: true, avatarUrl: true, roles: true, belt: true },
    take: 10,
  })

  return NextResponse.json(users)
}
