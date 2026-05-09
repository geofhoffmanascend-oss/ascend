import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: mediaItemId } = await params
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const [item, targetUser] = await Promise.all([
    prisma.mediaItem.findUnique({ where: { id: mediaItemId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, allowMediaTagging: true } }),
  ])

  if (!item)       return NextResponse.json({ error: 'Not found' },  { status: 404 })
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!targetUser.allowMediaTagging) {
    return NextResponse.json({ error: `${targetUser.name ?? 'This user'} has disabled photo tagging.` }, { status: 403 })
  }

  const isOwner = item.uploaderId === session.user.id
  const isStaff = session.user.role === 'admin' || session.user.role === 'instructor'
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tag = await prisma.mediaTag.upsert({
    where:   { mediaItemId_userId: { mediaItemId, userId } },
    create:  { mediaItemId, userId },
    update:  {},
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  })

  const taggerName = session.user.name ?? 'Someone'
  await createNotification(userId, 'general', `${taggerName} tagged you in a photo`, {
    link: `/gallery`,
  })

  return NextResponse.json(tag, { status: 201 })
}
