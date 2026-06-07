import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// GET /api/gyms/[id]/onboarding — data the member onboarding wizard needs about
// a gym: whether it has an admin (managed gym), its subscribable forums (with the
// caller's subscription state), and its gym-defined class groups.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const gym = await prisma.gym.findFirst({ where: { OR: [{ id }, { slug: id }] }, select: { id: true } })
  if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

  const userId = session?.user?.id ?? null

  const [adminCount, forums, classGroups, subs] = await Promise.all([
    prisma.user.count({ where: { gymId: gym.id, roles: { has: 'admin' } } }),
    prisma.forum.findMany({
      where: { gymId: gym.id, type: { in: ['gym_forum', 'program_forum', 'general', 'announcement'] } },
      select: { id: true, title: true, type: true, _count: { select: { posts: true, subscriptions: true } } },
      orderBy: { type: 'asc' },
    }),
    prisma.classProgram.findMany({
      where: { gymId: gym.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, description: true },
    }),
    userId
      ? prisma.forumSubscription.findMany({ where: { userId, forum: { gymId: gym.id } }, select: { forumId: true } })
      : Promise.resolve([]),
  ])

  const subscribedIds = new Set(subs.map(s => s.forumId))

  return NextResponse.json({
    hasAdmin: adminCount > 0,
    forums: forums.map(f => ({
      id: f.id,
      title: f.title,
      type: f.type,
      posts: f._count.posts,
      subscribers: f._count.subscriptions,
      subscribed: subscribedIds.has(f.id),
    })),
    classGroups,
  })
}
