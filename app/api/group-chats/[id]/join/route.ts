import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { isChatMember, addChatMember, getChatMemberIds, followsAnyMember } from '@/lib/groupChat'

// POST /api/group-chats/[id]/join — a non-member joins.
// If they follow any current member ("connected"), they join directly; otherwise a
// pending join request is created and surfaced in the chat for any member to approve.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const chat = await prisma.forum.findUnique({ where: { id }, select: { type: true, title: true } })
  if (!chat || chat.type !== 'group_chat') return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  if (await isChatMember(session.user.id, id)) {
    return NextResponse.json({ status: 'member' })
  }

  const memberIds = await getChatMemberIds(id)
  if (await followsAnyMember(session.user.id, memberIds)) {
    await addChatMember(session.user.id, id)
    await prisma.forumJoinRequest.deleteMany({ where: { forumId: id, userId: session.user.id } })
    return NextResponse.json({ status: 'joined' })
  }

  // Otherwise, request to join (idempotent).
  await prisma.forumJoinRequest.upsert({
    where: { forumId_userId: { forumId: id, userId: session.user.id } },
    create: { forumId: id, userId: session.user.id, status: 'pending' },
    update: { status: 'pending' },
  })
  // Notify current members there's a request.
  await Promise.all(
    memberIds.map(m =>
      createNotification(m, 'general', 'Someone wants to join your chat', {
        body: `A request to join "${chat.title}" is waiting for approval.`,
        link: `/chats/${id}`,
      }).catch(() => {}),
    ),
  )
  return NextResponse.json({ status: 'requested' })
}
