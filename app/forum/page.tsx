import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'
import { canPostInBeltForum, BELT_COLORS, BELT_LABELS } from '@/lib/belt'

export const metadata = { title: 'Forums' }

export default async function ForumListPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const isInstructor = session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')
  const gymId = session.user.gymId ?? null

  const userBelt = session.user.belt ?? 'white'

  const [user, allForums, subscriptions, gymForum, gym] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { blockedClassGroups: true },
    }),
    prisma.forum.findMany({
      include: {
        _count: { select: { posts: true } },
        posts: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, author: { select: { name: true } } } },
      },
    }),
    prisma.forumSubscription.findMany({
      where: { userId: session.user.id },
      select: { forumId: true },
    }),
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
  const subscribedIds = new Set(subscriptions.map(s => s.forumId))
  const gymForumWithCount = gymForum as typeof gymForum & { _count: { posts: number; subscriptions: number } } | null

  const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'] as const
  const beltForums = beltOrder
    .map(belt => allForums.find(f => f.type === 'belt_forum' && f.beltLevel === belt))
    .filter(Boolean) as typeof allForums

  const publicTypes = isInstructor
    ? ['general', 'announcement', 'instructor_only']
    : ['general', 'announcement']

  const publicForums = allForums.filter(f => publicTypes.includes(f.type as string))

  const classForums = allForums.filter(f =>
    f.type === 'class_forum' && subscribedIds.has(f.id)
  )

  const groupForums = allForums.filter(f =>
    f.type === 'group_forum' &&
    f.classGroup !== null &&
    !blocked.includes(f.classGroup as ClassGroup)
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Forums</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Forums</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Gym Forum */}
        {gymId && gym && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Your Gym</p>
            {gymForumWithCount ? (
              <Link
                href={`/forum/${gymForumWithCount.id}`}
                className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{gymForumWithCount.title ?? `${gym.name} Community`}</p>
                  <p className="text-xs text-ash mt-0.5">
                    {gymForumWithCount._count.subscriptions} {gymForumWithCount._count.subscriptions === 1 ? 'member' : 'members'}
                    {gym.participatingStatus === 'participating'
                      ? ' · Official Forum'
                      : ' · Community forum'}
                  </p>
                </div>
                <p className="text-xs text-ash flex-shrink-0 ml-4">{gymForumWithCount._count.posts} posts</p>
              </Link>
            ) : (
              <div className="border border-smoke bg-paper p-4 flex items-center justify-between">
                <p className="text-sm text-ash">No forum for {gym.name} yet.</p>
                <Link href={`/gyms/${gym.slug}`} className="text-sm text-brand-red hover:underline">
                  Create one →
                </Link>
              </div>
            )}
          </section>
        )}

        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">General</p>
          <div className="flex flex-col gap-2">
            {publicForums.map(f => (
              <ForumRow key={f.id} forum={f} />
            ))}
          </div>
        </section>

        {beltForums.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Belt Forums</p>
            <div className="flex flex-col gap-2">
              {beltForums.map(f => {
                const beltKey = f.beltLevel as string
                const canPost = canPostInBeltForum(userBelt, beltKey)
                const isUserBelt = beltKey === userBelt
                return (
                  <Link
                    key={f.id}
                    href={`/forum/${f.id}`}
                    className={`border bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between ${isUserBelt ? 'border-steel' : 'border-smoke'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${BELT_COLORS[beltKey]}`} />
                      <div>
                        <p className={`text-sm font-medium ${isUserBelt ? 'text-ink font-bold' : 'text-ink'}`}>
                          {BELT_LABELS[beltKey]}
                        </p>
                        <p className="text-xs text-ash mt-0.5">{f._count.posts} posts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className="text-xs text-ash">Read</span>
                      {canPost ? (
                        <span className="text-xs text-ash">· Post</span>
                      ) : (
                        <span className="text-xs text-ash" title={`Requires ${BELT_LABELS[beltKey]} or higher`}>· 🔒 Post</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {groupForums.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Class Groups</p>
            <div className="flex flex-col gap-2">
              {groupForums.map(f => (
                <ForumRow key={f.id} forum={f} />
              ))}
            </div>
          </section>
        )}

        {classForums.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">My Classes</p>
            <div className="flex flex-col gap-2">
              {classForums.map(f => (
                <ForumRow key={f.id} forum={f} />
              ))}
            </div>
          </section>
        )}

        {classForums.length === 0 && (
          <p className="text-ash text-sm italic">
            Register for a class to join its forum. <Link href="/schedule" className="text-brand-red hover:underline">View schedule →</Link>
          </p>
        )}
      </div>
    </div>
  )
}

function ForumRow({ forum }: { forum: { id: string; title: string; type: string; _count: { posts: number }; posts: { createdAt: Date; author: { name: string | null } }[] } }) {
  const latest = forum.posts[0]
  return (
    <Link
      href={`/forum/${forum.id}`}
      className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-medium text-ink">{forum.title}</p>
        {latest && (
          <p className="text-xs text-ash mt-0.5">
            Last post by {latest.author.name ?? 'Unknown'} · {new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
      <p className="text-xs text-ash flex-shrink-0 ml-4">{forum._count.posts} posts</p>
    </Link>
  )
}
