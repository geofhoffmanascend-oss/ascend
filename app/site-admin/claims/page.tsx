import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ClaimReviewClient } from './ClaimReviewClient'

export const metadata = { title: 'Gym Claims' }

export default async function SiteAdminClaimsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('site_admin')) redirect('/dashboard')

  const rows = await prisma.gymClaim.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, note: true, createdAt: true,
      gym: { select: { id: true, name: true, slug: true, city: true, state: true, _count: { select: { users: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  })

  const claims = rows.map(r => ({
    id: r.id,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    gym: { id: r.gym.id, name: r.gym.name, slug: r.gym.slug, city: r.gym.city, state: r.gym.state, memberCount: r.gym._count.users },
    user: { id: r.user.id, name: r.user.name, email: r.user.email },
  }))

  return (
    <div>
      <div className="mb-2"><Link href="/site-admin" className="text-xs text-ash hover:text-ink transition-colors">← Site Admin</Link></div>
      <h1 className="font-display text-2xl text-ink mb-1">Gym Claims</h1>
      <p className="text-slate text-sm mb-6">Owners claiming unclaimed gym listings. Approving transfers control (grants admin + instructor and moves their home gym).</p>
      <ClaimReviewClient claims={claims} />
    </div>
  )
}
