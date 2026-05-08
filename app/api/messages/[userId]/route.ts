import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId: otherId } = await params
  const myId = session.user.id

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: myId,    recipientId: otherId },
        { senderId: otherId, recipientId: myId    },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  return NextResponse.json(messages)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId: recipientId } = await params
  const senderId = session.user.id

  if (senderId === recipientId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { allowDmsFromStudents: true, role: true, name: true },
  })

  if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Enforce DM permission: if recipient opted out of student DMs, only allow instructors/admins
  if (!recipient.allowDmsFromStudents && session.user.role === 'student') {
    return NextResponse.json(
      { error: 'This user is not accepting direct messages from students.' },
      { status: 403 },
    )
  }

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  const message = await prisma.directMessage.create({
    data: { senderId, recipientId, body: body.trim() },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  })

  // Notify recipient
  const senderName = session.user.name ?? 'Someone'
  await createNotification(recipientId, 'private_message', `New message from ${senderName}`, {
    body: body.trim().slice(0, 80),
    link: `/messages/${senderId}`,
  })

  return NextResponse.json(message, { status: 201 })
}
