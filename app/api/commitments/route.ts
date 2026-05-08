import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { classSessionId } = await req.json()
  if (!classSessionId) return NextResponse.json({ error: 'classSessionId required' }, { status: 400 })

  const existing = await prisma.commitment.findUnique({
    where: { userId_classSessionId: { userId: session.user.id, classSessionId } },
  })
  if (existing) return NextResponse.json(existing)

  const [user, classSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { weightClass: true },
    }),
    prisma.classSession.findUnique({
      where: { id: classSessionId },
      select: { class: { select: { forum: { select: { id: true } } } } },
    }),
  ])

  const commitment = await prisma.commitment.create({
    data: {
      userId: session.user.id,
      classSessionId,
      weightClass: user?.weightClass ?? null,
    },
  })

  // Auto-subscribe to class forum on first commitment
  const forumId = classSession?.class?.forum?.id
  if (forumId) {
    await prisma.forumSubscription.upsert({
      where: { userId_forumId: { userId: session.user.id, forumId } },
      create: { userId: session.user.id, forumId },
      update: {},
    })
  }

  return NextResponse.json(commitment, { status: 201 })
}
