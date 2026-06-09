import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// GET /api/gyms/claimable?q= — Phase 39. Unclaimed gyms (no admin user) that an
// owner can claim, filtered by name/city/state. Requires login.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()

  const gyms = await prisma.gym.findMany({
    where: {
      // Unclaimed = no member with the admin role.
      users: { none: { roles: { has: 'admin' } } },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { city: { contains: q, mode: 'insensitive' as const } },
              { state: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true, name: true, slug: true, city: true, state: true,
      headInstructorName: true,
      _count: { select: { users: true } },
    },
    orderBy: { name: 'asc' },
    take: 25,
  })

  return NextResponse.json(
    gyms.map(g => ({
      id: g.id, name: g.name, slug: g.slug, city: g.city, state: g.state,
      headInstructorName: g.headInstructorName, memberCount: g._count.users,
    })),
  )
}
