import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'
import { GymTier } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '25'))
  const status = searchParams.get('status') as GymTier | null

  const [gyms, total] = await Promise.all([
    prisma.gym.findMany({
      where: status ? { participatingStatus: status } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { members: true } },
      },
    }),
    prisma.gym.count({ where: status ? { participatingStatus: status } : undefined }),
  ])

  // member count filtered to active only
  const gymIds = gyms.map(g => g.id)
  const activeCounts = await prisma.gymMembership.groupBy({
    by: ['gymId'],
    where: { gymId: { in: gymIds }, status: 'active' },
    _count: true,
  })
  const activeMap = Object.fromEntries(activeCounts.map(r => [r.gymId, r._count]))

  const result = gyms.map(g => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    participatingStatus: g.participatingStatus,
    headInstructorName: g.headInstructorName,
    city: g.city,
    state: g.state,
    createdAt: g.createdAt.toISOString(),
    memberCount: activeMap[g.id] ?? 0,
  }))

  return NextResponse.json({ gyms: result, total, page, limit })
}
