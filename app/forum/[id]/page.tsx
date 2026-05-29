import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ForumClient } from './ForumClient'
import { canPostInBeltForum, BELT_LABELS, BELT_COLORS } from '@/lib/belt'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const forum = await prisma.forum.findUnique({ where: { id }, select: { title: true } })
  return { title: forum?.title ?? 'Forum' }
}

export default async function ForumPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const forum = await prisma.forum.findUnique({
    where: { id },
    include: {
      posts: {
        where: { parentId: null },
        include: {
          author: { select: { name: true, belt: true, beltVerified: true, beltVerifiedBy: true } },
          replies: {
            include: { author: { select: { name: true, belt: true, beltVerified: true, beltVerifiedBy: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      subscriptions: { where: { userId: session.user.id }, select: { id: true } },
      gym: { select: { name: true, participatingStatus: true } },
    },
  })

  if (!forum) notFound()

  // Instructor-only forum: restrict access
  if ((forum.type as string) === 'instructor_only' && !session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) {
    redirect('/forum')
  }

  // Group forum: block if admin has restricted this group for the user
  if ((forum.type as string) === 'group_forum' && forum.classGroup) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { blockedClassGroups: true } })
    if (user?.blockedClassGroups?.includes(forum.classGroup as any)) redirect('/forum')
  }

  // Gym forum: require matching gymId (site_admin can bypass)
  if ((forum.type as string) === 'gym_forum') {
    const isSiteAdmin = session.user.roles?.includes('site_admin')
    if (!isSiteAdmin && session.user.gymId !== forum.gymId) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-ash text-sm">This forum is for members of {forum.gym?.name ?? 'this gym'}.</p>
          <a href="/gyms" className="text-brand-red text-sm hover:underline mt-2 inline-block">Find your gym →</a>
        </div>
      )
    }
  }

  const posts = forum.posts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    replies: p.replies.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }))

  const isSubscribed = forum.subscriptions.length > 0

  const isBeltForum = (forum.type as string) === 'belt_forum'
  const userCanPost = isBeltForum && forum.beltLevel
    ? canPostInBeltForum(session.user.belt ?? 'white', forum.beltLevel)
    : true

  const FORUM_LABELS: Record<string, string> = {
    general: 'General', announcement: 'Announcements',
    class_forum: 'Class Forum', private_lesson: 'Private Lessons',
    instructor_only: 'Instructor Forum', gym_forum: 'Gym Community',
  }

  const isGymForum = (forum.type as string) === 'gym_forum'
  const isParticipating = forum.gym?.participatingStatus === 'participating'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/forum" className="text-xs text-ash hover:text-ink transition-colors">← Forums</Link>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="inline-block bg-brand-red px-3 py-1">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              {FORUM_LABELS[forum.type] ?? 'Forum'}
            </span>
          </div>
          {isGymForum && (
            isParticipating ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 text-xs font-medium text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Official {forum.gym?.name} Forum
              </span>
            ) : (
              <span className="text-xs text-ash border border-smoke px-2 py-0.5">
                Community forum — not officially managed by {forum.gym?.name}
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl text-ink">{forum.title}</h1>
          {isBeltForum && forum.beltLevel && (
            <span className={`w-4 h-4 rounded-full flex-shrink-0 ${BELT_COLORS[forum.beltLevel]}`} />
          )}
        </div>
        {forum.description && <p className="text-ash text-sm mt-1">{forum.description}</p>}
        {isBeltForum && !userCanPost && forum.beltLevel && (
          <p className="text-sm text-ash mt-2 border border-smoke bg-mist px-3 py-2">
            You can read this forum, but you need to reach {BELT_LABELS[forum.beltLevel]} to post.
          </p>
        )}
      </div>

      <ForumClient
        forumId={forum.id}
        posts={posts}
        userId={session.user.id}
        userRoles={session.user.roles}
        isSubscribed={isSubscribed}
        forumType={forum.type}
        canPost={userCanPost}
        isBeltForum={isBeltForum}
      />
    </div>
  )
}
