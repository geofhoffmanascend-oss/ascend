import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { addChatMember } from '@/lib/groupChat'

// POST /api/group-chats — start a new group chat. Creator becomes the first member.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'A name is required.' }, { status: 400 })
  }

  let gymId: string | null = null
  if (typeof body.gymId === 'string' && body.gymId) {
    const gym = await prisma.gym.findUnique({ where: { id: body.gymId }, select: { id: true } })
    if (!gym) return NextResponse.json({ error: 'Gym not found.' }, { status: 400 })
    gymId = gym.id
  }

  const chat = await prisma.forum.create({
    data: {
      type: 'group_chat',
      title: body.title.trim().slice(0, 80),
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 280) || null : null,
      gymId,
      createdById: session.user.id,
    },
  })
  await addChatMember(session.user.id, chat.id)

  return NextResponse.json({ id: chat.id }, { status: 201 })
}

// GET /api/group-chats — chats I'm in, plus discoverable (gym-associated) chats I'm not in.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const myForumIds = (await prisma.forumSubscription.findMany({
    where: { userId: session.user.id, forum: { type: 'group_chat' } },
    select: { forumId: true },
  })).map(s => s.forumId)

  const [mine, discoverable] = await Promise.all([
    prisma.forum.findMany({
      where: { type: 'group_chat', id: { in: myForumIds } },
      select: {
        id: true, title: true, description: true,
        gym: { select: { name: true, slug: true } },
        _count: { select: { subscriptions: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.forum.findMany({
      where: { type: 'group_chat', gymId: { not: null }, id: { notIn: myForumIds } },
      select: {
        id: true, title: true, description: true,
        gym: { select: { name: true, slug: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return NextResponse.json({ mine, discoverable })
}
