import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// POST = follow, DELETE = unfollow
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: targetId } = await params
  const followerId = session.user.id
  if (targetId === followerId) return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Idempotent: creating an existing follow is a no-op.
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetId } },
  })
  if (!existing) {
    await prisma.follow.create({ data: { followerId, followingId: targetId } })
    await createNotification(targetId, 'new_follower', `${session.user.name ?? 'Someone'} started following you`, {
      link: `/profile/${followerId}`,
    })
  }

  return NextResponse.json({ following: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: targetId } = await params
  await prisma.follow.deleteMany({
    where: { followerId: session.user.id, followingId: targetId },
  })
  return NextResponse.json({ following: false })
}
