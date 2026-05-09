import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.messageRequest.findMany({
    where: { recipientId: session.user.id, status: 'pending' },
    include: { sender: { select: { id: true, name: true, avatarUrl: true, belt: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}
