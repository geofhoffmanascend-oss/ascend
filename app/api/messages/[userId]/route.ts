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

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  const senderName = session.user.name ?? 'Someone'

  // If recipient has restricted DMs and sender is a student, route to message request
  if (!recipient.allowDmsFromStudents && session.user.role === 'student') {
    // Check for approved request — if approved, allow normal DM
    const existingRequest = await prisma.messageRequest.findUnique({
      where: { senderId_recipientId: { senderId, recipientId } },
    })

    if (existingRequest?.status === 'approved') {
      // Approved — fall through to normal DM below
    } else if (existingRequest?.status === 'pending') {
      return NextResponse.json({ type: 'request', status: 'pending' }, { status: 200 })
    } else {
      // Create or re-create request
      await prisma.messageRequest.upsert({
        where: { senderId_recipientId: { senderId, recipientId } },
        create: { senderId, recipientId, initialMessage: body.trim(), status: 'pending' },
        update: { initialMessage: body.trim(), status: 'pending' },
      })
      await createNotification(recipientId, 'private_message', `Message request from ${senderName}`, {
        body: 'They want to send you a message. Approve or deny in your Messages inbox.',
        link: '/messages/requests',
      })
      return NextResponse.json({ type: 'request', status: 'created' }, { status: 201 })
    }
  }

  const message = await prisma.directMessage.create({
    data: { senderId, recipientId, body: body.trim() },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  })

  await createNotification(recipientId, 'private_message', `New message from ${senderName}`, {
    body: body.trim().slice(0, 80),
    link: `/messages/${senderId}`,
  })

  return NextResponse.json(message, { status: 201 })
}
