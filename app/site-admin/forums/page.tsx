import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { ForumModerationList } from './ForumModerationList'

export const metadata: Metadata = { title: 'Forum Moderation — Site Admin' }

export default async function SiteAdminForumsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  // All forums NOT controlled by a participating gym (platform forums + free/
  // non-participating gym forums). Participating gyms moderate their own.
  const forums = await prisma.forum.findMany({
    where: {
      OR: [
        { gymId: null },
        { gym: { participatingStatus: { not: 'participating' } } },
      ],
    },
    select: {
      id: true, title: true, type: true,
      gym: { select: { name: true } },
      _count: { select: { posts: true } },
    },
    orderBy: [{ gym: { name: 'asc' } }, { title: 'asc' }],
  })

  const list = forums.map(f => ({
    id: f.id,
    title: f.title,
    type: f.type as string,
    gymName: f.gym?.name ?? null,
    postCount: f._count.posts,
  }))

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Forums</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Forum Moderation</h1>
        <p className="text-sm text-slate mt-1">Community &amp; non-participating-gym forums. Participating gyms moderate their own.</p>
      </div>
      <ForumModerationList forums={list} />
    </div>
  )
}
