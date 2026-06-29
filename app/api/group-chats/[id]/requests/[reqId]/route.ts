import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { isChatMember, addChatMember } from '@/lib/groupChat'

// POST /api/group-chats/[id]/requests/[reqId] — any member approves/declines a join request.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, reqId } = await params
  const { action } = (await req.json().catch(() => ({}))) as { action?: 'approve' | 'decline' }
  if (action !== 'approve' && action !== 'decline') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (!(await isChatMember(session.user.id, id))) {
    return NextResponse.json({ error: 'Only members can approve.' }, { status: 403 })
  }

  const request = await prisma.forumJoinRequest.findUnique({ where: { id: reqId }, select: { forumId: true, userId: true, status: true } })
  if (!request || request.forumId !== id) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const chat = await prisma.forum.findUnique({ where: { id }, select: { title: true } })

  if (action === 'approve') {
    await addChatMember(request.userId, id)
    await prisma.forumJoinRequest.delete({ where: { id: reqId } })
    await createNotification(request.userId, 'general', 'Your join request was approved', {
      body: `You're now in "${chat?.title ?? 'the chat'}".`,
      link: `/chats/${id}`,
    }).catch(() => {})
    return NextResponse.json({ status: 'approved' })
  }

  await prisma.forumJoinRequest.update({ where: { id: reqId }, data: { status: 'declined' } })
  return NextResponse.json({ status: 'declined' })
}
