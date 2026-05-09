import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action } = await req.json()

  if (action !== 'approve' && action !== 'deny') {
    return NextResponse.json({ error: 'action must be approve or deny' }, { status: 400 })
  }

  const request = await prisma.messageRequest.findUnique({
    where: { id },
    include: { sender: { select: { name: true } } },
  })

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (request.recipientId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Request already resolved' }, { status: 409 })
  }

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.messageRequest.update({ where: { id }, data: { status: 'approved' } }),
      prisma.directMessage.create({
        data: {
          senderId:    request.senderId,
          recipientId: request.recipientId,
          body:        request.initialMessage,
        },
      }),
    ])

    // Notify sender their request was accepted
    const recipientName = session.user.name ?? 'Someone'
    await createNotification(request.senderId, 'private_message', `${recipientName} accepted your message request`, {
      link: `/messages/${request.recipientId}`,
    })
  } else {
    await prisma.messageRequest.update({ where: { id }, data: { status: 'denied' } })
  }

  return NextResponse.json({ ok: true })
}
