import Link from 'next/link'
import prisma from '@/lib/database'
import { GymTier } from '@prisma/client'
import { GymListClient } from './GymListClient'

export const metadata = { title: 'Gyms — Site Admin' }

export default async function SiteAdminGymsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}) {
  const { page: pageStr, status, q } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const limit = 25

  const tierFilter = (status as GymTier) || undefined
  const search = q?.trim() || undefined

  const where = {
    ...(tierFilter ? { participatingStatus: tierFilter } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [gyms, total] = await Promise.all([
    prisma.gym.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.gym.count({ where }),
  ])

  const gymIds = gyms.map(g => g.id)
  const activeCounts = await prisma.gymMembership.groupBy({
    by: ['gymId'],
    where: { gymId: { in: gymIds }, status: 'active' },
    _count: true,
  })
  const activeMap = Object.fromEntries(activeCounts.map(r => [r.gymId, r._count]))

  const rows = gyms.map(g => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    participatingStatus: g.participatingStatus as string,
    headInstructorName: g.headInstructorName,
    city: g.city,
    state: g.state,
    createdAt: g.createdAt.toISOString(),
    memberCount: activeMap[g.id] ?? 0,
  }))

  return (
    <div className="px-6 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Gyms</span>
        </div>
        <h1 className="font-display text-2xl text-ink">All Gyms</h1>
        <p className="text-sm text-ash mt-1">{total} total</p>
      </div>

      <GymListClient gyms={rows} total={total} page={page} limit={limit} />
    </div>
  )
}
