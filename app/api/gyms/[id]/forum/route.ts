import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { getPlatformSettings } from '@/lib/platformSettings'
import { getGymFeatures } from '@/lib/gymFeatures'

// GET /api/gyms/[id]/forum — get gym_forum for this gym (or null)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: gymId } = await params

  const [forum, gymMemberCount] = await Promise.all([
    prisma.forum.findFirst({
      where: { gymId, type: 'gym_forum' },
      include: { _count: { select: { posts: true, subscriptions: true } } },
    }),
    prisma.gymMembership.count({ where: { gymId, status: 'active' } }),
  ])

  return NextResponse.json({ forum, gymMemberCount })
}

// POST /api/gyms/[id]/forum — create gym_forum (idempotent)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: gymId } = await params

  const isSiteAdmin = session.user.roles?.includes('site_admin')
  const isAdmin = session.user.roles?.includes('admin')
  if (!isSiteAdmin && !isAdmin) {
    const [{ allowGymForumCreation }, gymFeatures] = await Promise.all([
      getPlatformSettings(),
      getGymFeatures(gymId),
    ])
    if (!allowGymForumCreation || !gymFeatures.gymForumEnabled) {
      return NextResponse.json({ error: 'Gym forum creation is not available for this gym.' }, { status: 403 })
    }
  }

  // Verify caller is an active member of this gym
  const membership = await prisma.gymMembership.findUnique({
    where: { userId_gymId: { userId: session.user.id, gymId } },
    select: { status: true },
  })
  if (!membership || membership.status !== 'active') {
    return NextResponse.json({ error: 'You must be an active member of this gym' }, { status: 403 })
  }

  const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { name: true } })
  if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

  // Idempotent — return existing forum if already exists
  const existing = await prisma.forum.findFirst({ where: { gymId, type: 'gym_forum' } })
  if (existing) return NextResponse.json({ forum: existing }, { status: 200 })

  const forum = await prisma.forum.create({
    data: {
      title: `${gym.name} Community`,
      type: 'gym_forum',
      gymId,
    },
  })

  // Subscribe the creator
  await prisma.forumSubscription.create({ data: { userId: session.user.id, forumId: forum.id } })

  // Notify all other gym members
  const members = await prisma.gymMembership.findMany({
    where: { gymId, status: 'active', userId: { not: session.user.id } },
    select: { userId: true },
  })
  await Promise.all(
    members.map(m =>
      createNotification(m.userId, 'general', `${gym.name} now has a community forum`, {
        body: 'Join to connect with your training partners.',
        link: `/forum/${forum.id}`,
      })
    )
  )

  return NextResponse.json({ forum }, { status: 201 })
}
