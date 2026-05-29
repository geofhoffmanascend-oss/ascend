import { NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

export async function GET() {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalGyms, participatingGyms, totalUsers, unaffiliatedUsers, pendingEventsCount, newGymsCount] = await Promise.all([
    prisma.gym.count(),
    prisma.gym.count({ where: { participatingStatus: 'participating' } }),
    prisma.user.count(),
    prisma.user.count({ where: { gymId: null } }),
    prisma.publicEvent.count({ where: { status: 'pending' } }),
    prisma.gym.count({ where: { participatingStatus: 'free', createdAt: { gte: sevenDaysAgo } } }),
  ])

  return NextResponse.json({ totalGyms, participatingGyms, totalUsers, unaffiliatedUsers, pendingEventsCount, newGymsCount })
}
