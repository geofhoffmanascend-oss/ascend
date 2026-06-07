import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'
import { ForumListClient, type ForumVM } from './ForumListClient'

export const metadata: Metadata = { title: 'Forums' }

export default async function ForumListPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const isInstructor = session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')
  const gymId = session.user.gymId ?? null

  const [user, allForums, subscriptions, reads, gym] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { blockedClassGroups: true, hiddenClassGroups: true, blockedProgramIds: true },
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
      ? prisma.gym.findUnique({ where: { id: gymId }, select: { name: true, slug: true, participatingStatus: true } })
      : Promise.resolve(null),
  ])

  const blockedPrograms = (user?.blockedProgramIds ?? []) as string[]
  const blocked = (user?.blockedClassGroups ?? []) as ClassGroup[]
  const hidden = (user?.hiddenClassGroups ?? []) as ClassGroup[]
  const subscribedIds = new Set(subscriptions.map(s => s.forumId))
  const readMap = new Map(reads.map(r => [r.forumId, r.lastReadAt]))

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

  // Public forums = platform-wide (no gym), shown to ALL users by default.
  const publicTypes = isInstructor
    ? ['general', 'announcement', 'instructor_only']
    : ['general', 'announcement']
  const general: ForumVM[] = allForums
    .filter(f => f.gymId === null && publicTypes.includes(f.type as string))
    .map(f => baseVM(f, true))

  // Gym forums = everything scoped to the user's gym (community + topic forums
  // like "6am Crew"), shown under the gym's name to members.
  const gymForums: ForumVM[] = gymId
    ? allForums
        .filter(f => f.gymId === gymId && (
          ['gym_forum', 'general', 'announcement'].includes(f.type as string) ||
          // Class-group (program) forums — shown to members not blocked from the group
          (f.type === 'program_forum' && !(f.programId && blockedPrograms.includes(f.programId)))
        ))
        .map(f => baseVM(f, true))
    : []

  // Belt forums retired (moved away from belt-level forums; gym-created forums TBD).
  const belt: ForumVM[] = []

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


  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Forums</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Forums</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Gym forums — shown under the gym's name to members */}
        {gymId && gym && gymForums.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">{gym.name}</p>
            <div className="flex flex-col gap-2">
              {gymForums
                .slice()
                .sort((a, b) => (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || (Date.parse(b.latestAt ?? '0') - Date.parse(a.latestAt ?? '0')))
                .map(f => (
                  <Link
                    key={f.id}
                    href={`/forum/${f.id}`}
                    className={`bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between border ${
                      f.unread > 0 ? 'border-l-2 border-l-brand-red border-y-smoke border-r-smoke' : 'border-smoke'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm text-ink ${f.unread > 0 ? 'font-bold' : 'font-medium'}`}>{f.title}</p>
                      <p className="text-xs text-ash mt-0.5">
                        {f.latestAt ? `Last post by ${f.latestBy ?? 'Unknown'} · ${new Date(f.latestAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No posts yet'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {f.unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-paper text-[11px] font-bold leading-none">
                          {f.unread > 9 ? '9+' : f.unread}
                        </span>
                      )}
                      <p className="text-xs text-ash">{f.totalPosts} posts</p>
                    </div>
                  </Link>
                ))}
            </div>
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
