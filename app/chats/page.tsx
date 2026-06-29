import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ChatsClient } from './ChatsClient'

export const metadata = { title: 'Group Chats' }

export default async function ChatsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const myGym = session.user.gymId
    ? await prisma.gym.findUnique({ where: { id: session.user.gymId }, select: { id: true, name: true } })
    : null

  const myForumIds = (await prisma.forumSubscription.findMany({
    where: { userId: session.user.id, forum: { type: 'group_chat' } },
    select: { forumId: true },
  })).map(s => s.forumId)

  const [mine, discoverable] = await Promise.all([
    prisma.forum.findMany({
      where: { type: 'group_chat', id: { in: myForumIds } },
      select: {
        id: true, title: true, description: true,
        gym: { select: { name: true } },
        _count: { select: { subscriptions: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.forum.findMany({
      where: { type: 'group_chat', gymId: { not: null }, id: { notIn: myForumIds } },
      select: {
        id: true, title: true, description: true,
        gym: { select: { name: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-2">
          Group Chats
        </span>
        <h1 className="font-display text-2xl text-ink">Your conversations</h1>
        <p className="text-sm text-slate mt-1">Start a chat with teammates. Anyone in a chat can invite others.</p>
      </div>

      <ChatsClient myGymId={myGym?.id ?? null} myGymName={myGym?.name ?? null} />

      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Your chats</p>
        {mine.length === 0 ? (
          <p className="text-sm text-slate">No chats yet — start one above.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {mine.map(c => (
              <Link key={c.id} href={`/chats/${c.id}`} className="border border-smoke bg-paper p-4 hover:border-steel transition-colors block">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{c.title}</p>
                  <span className="text-xs text-ash">{c._count.subscriptions} {c._count.subscriptions === 1 ? 'member' : 'members'}</span>
                </div>
                {c.gym && <p className="text-xs text-slate mt-0.5">{c.gym.name}</p>}
                {c.description && <p className="text-xs text-slate mt-1">{c.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {discoverable.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Discover (gym chats)</p>
          <div className="flex flex-col gap-2">
            {discoverable.map(c => (
              <Link key={c.id} href={`/chats/${c.id}`} className="border border-smoke bg-paper p-4 hover:border-steel transition-colors block">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{c.title}</p>
                  <span className="text-xs text-ash">{c._count.subscriptions} {c._count.subscriptions === 1 ? 'member' : 'members'}</span>
                </div>
                {c.gym && <p className="text-xs text-slate mt-0.5">{c.gym.name}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
