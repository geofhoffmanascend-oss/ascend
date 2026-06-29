import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { isChatMember, addChatMember } from '@/lib/groupChat'

// POST /api/group-chats/[id]/invite — any member can invite another user (instant add).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { userId } = await req.json().catch(() => ({}))
  if (typeof userId !== 'string' || !userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const chat = await prisma.forum.findUnique({ where: { id }, select: { type: true, title: true } })
  if (!chat || chat.type !== 'group_chat') return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  if (!(await isChatMember(session.user.id, id))) {
    return NextResponse.json({ error: 'Only members can invite.' }, { status: 403 })
  }
  if (await isChatMember(userId, id)) {
    return NextResponse.json({ ok: true, alreadyMember: true })
  }

  await addChatMember(userId, id)
  // Clear any pending join request now that they're in.
  await prisma.forumJoinRequest.deleteMany({ where: { forumId: id, userId } })
  await createNotification(userId, 'general', 'Added to a group chat', {
    body: `You were added to "${chat.title}".`,
    link: `/chats/${id}`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
