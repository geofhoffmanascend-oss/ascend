import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.viewAs && !session.viewAs.bySiteAdmin) return NextResponse.json([])

  const userId = session.user.id

  // Get all messages involving current user
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender:    { select: { id: true, name: true, avatarUrl: true } },
      recipient: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  // Collapse into one entry per conversation partner
  const seen = new Set<string>()
  const conversations: typeof messages = []
  for (const msg of messages) {
    const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId
    if (!seen.has(otherId)) {
      seen.add(otherId)
      conversations.push(msg)
    }
  }

  return NextResponse.json(conversations)
}
