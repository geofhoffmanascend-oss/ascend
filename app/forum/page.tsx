import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'
import { canPostInBeltForum } from '@/lib/belt'
import { ForumListClient, type ForumVM } from './ForumListClient'

export const metadata: Metadata = { title: 'Forums' }

export default async function ForumListPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const isInstructor = session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')
  const gymId = session.user.gymId ?? null
  const userBelt = session.user.belt ?? 'white'

  const [user, allForums, subscriptions, reads, gymForum, gym] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { blockedClassGroups: true, hiddenClassGroups: true },
    }),
    prisma.forum.findMany({
      include: {
        _count: { select: { posts: true } },
        posts: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, author: { select: { name: true } } } },
      },
    }),
    prisma.forumSubscription.findMany({ where: { userId }, select: { forumId: true } }),
    prisma.forumRead.findMany({ where: { userId }, select: { forumId: true, lastReadAt: true } }),
    gymId
      ? prisma.forum.findFirst({
          where: { gymId, type: 'gym_forum' },
          include: { _count: { select: { posts: true, subscriptions: true } } },
        })
      : Promise.resolve(null),
    gymId
      ? prisma.gym.findUnique({ where: { id: gymId }, select: { name: true, slug: true, participatingStatus: true } })
      : Promise.resolve(null),
  ])

  const blocked = (user?.blockedClassGroups ?? []) as ClassGroup[]
  const hidden = (user?.hiddenClassGroups ?? []) as ClassGroup[]
  const subscribedIds = new Set(subscriptions.map(s => s.forumId))
  const readMap = new Map(reads.map(r => [r.forumId, r.lastReadAt]))
  const gymForumWithCount = gymForum as typeof gymForum & { _count: { posts: number; subscriptions: number } } | null

  // Compute unread counts only for forums the user has opened before (a read
  // record exists) AND that have a newer post — keeps it quiet for first visits.
  const unreadCandidates = allForums.filter(f => {
    const lr = readMap.get(f.id)
    const latest = f.posts[0]?.createdAt
    return lr && latest && latest > lr
  })
  const unreadEntries = await Promise.all(
    unreadCandidates.map(async f => {
      const lr = readMap.get(f.id)!
      const count = await prisma.post.count({
        where: { forumId: f.id, createdAt: { gt: lr }, authorId: { not: userId } },
      })
      return [f.id, count] as const
    }),
  )
  const unreadMap = new Map<string, number>(unreadEntries)

  type RawForum = (typeof allForums)[number]
  const baseVM = (f: RawForum, inDefault: boolean): ForumVM => ({
    id: f.id,
    title: f.title,
    totalPosts: f._count.posts,
    unread: unreadMap.get(f.id) ?? 0,
    latestAt: f.posts[0]?.createdAt ? f.posts[0].createdAt.toISOString() : null,
    latestBy: f.posts[0]?.author.name ?? null,
    inDefault,
  })

  // General (announcement + instructor-only always shown; general only if subscribed)
  const publicTypes = isInstructor
    ? ['general', 'announcement', 'instructor_only']
    : ['general', 'announcement']
  const general: ForumVM[] = allForums
    .filter(f => publicTypes.includes(f.type as string))
    .map(f => baseVM(f, f.type !== 'general' || subscribedIds.has(f.id)))

  // Belt forums (your own belt always shown; others only if subscribed)
  const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'] as const
  const belt: ForumVM[] = beltOrder
    .map(b => allForums.find(f => f.type === 'belt_forum' && f.beltLevel === b))
    .filter(Boolean)
    .map(f => {
      const ff = f as RawForum
      const beltKey = ff.beltLevel as string
      const isUserBelt = beltKey === userBelt
      return {
        ...baseVM(ff, isUserBelt || subscribedIds.has(ff.id)),
        beltKey,
        isUserBelt,
        canPost: canPostInBeltForum(userBelt, beltKey),
      }
    })

  // Class-group forums (exclude blocked + hidden groups; default-shown if subscribed)
  const group: ForumVM[] = allForums
    .filter(f =>
      f.type === 'group_forum' &&
      f.classGroup !== null &&
      !blocked.includes(f.classGroup as ClassGroup) &&
      !hidden.includes(f.classGroup as ClassGroup),
    )
    .map(f => baseVM(f, subscribedIds.has(f.id)))

  // Class forums — only the ones you're subscribed to (auto-subscribed on register)
  const cls: ForumVM[] = allForums
    .filter(f => f.type === 'class_forum' && subscribedIds.has(f.id))
    .map(f => baseVM(f, true))

  const gymUnread = gymForumWithCount ? (unreadMap.get(gymForumWithCount.id) ?? 0) : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Forums</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Forums</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Gym Forum (always shown) */}
        {gymId && gym && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Your Gym</p>
            {gymForumWithCount ? (
              <Link
                href={`/forum/${gymForumWithCount.id}`}
                className={`bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between border ${
                  gymUnread > 0 ? 'border-l-2 border-l-brand-red border-y-smoke border-r-smoke' : 'border-smoke'
                }`}
              >
                <div>
                  <p className={`text-sm text-ink ${gymUnread > 0 ? 'font-bold' : 'font-medium'}`}>{gymForumWithCount.title ?? `${gym.name} Community`}</p>
                  <p className="text-xs text-ash mt-0.5">
                    {gymForumWithCount._count.subscriptions} {gymForumWithCount._count.subscriptions === 1 ? 'member' : 'members'}
                    {gym.participatingStatus === 'participating' ? ' · Official Forum' : ' · Community forum'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {gymUnread > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-paper text-[11px] font-bold leading-none">
                      {gymUnread > 9 ? '9+' : gymUnread}
                    </span>
                  )}
                  <p className="text-xs text-ash">{gymForumWithCount._count.posts} posts</p>
                </div>
              </Link>
            ) : (
              <div className="border border-smoke bg-paper p-4 flex items-center justify-between">
                <p className="text-sm text-ash">No forum for {gym.name} yet.</p>
                <Link href={`/gyms/${gym.slug}`} className="text-sm text-brand-red hover:underline">Create one →</Link>
              </div>
            )}
          </section>
        )}

        <ForumListClient
          general={general}
          belt={belt}
          group={group}
          cls={cls}
          noClasses={cls.length === 0}
        />
      </div>
    </div>
  )
}
