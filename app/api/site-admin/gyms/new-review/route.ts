import { NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

export async function GET() {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const gyms = await prisma.gym.findMany({
    where: { participatingStatus: 'free', createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { members: true } } },
  })

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
    city: g.city,
    state: g.state,
    headInstructorName: g.headInstructorName,
    createdAt: g.createdAt.toISOString(),
    memberCount: activeMap[g.id] ?? 0,
  }))

  return NextResponse.json({ gyms: result })
}
