import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: forumId } = await params
  await prisma.forumSubscription.upsert({
    where: { userId_forumId: { userId: session.user.id, forumId } },
    create: { userId: session.user.id, forumId },
    update: {},
  })
  return NextResponse.json({ subscribed: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: forumId } = await params
  await prisma.forumSubscription.deleteMany({
    where: { userId: session.user.id, forumId },
  })
  return NextResponse.json({ subscribed: false })
}
