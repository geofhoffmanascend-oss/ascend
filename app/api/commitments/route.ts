import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { isInCheckinWindow } from '@/lib/checkin'
import { classTypeToGroup } from '@/lib/classGroups'
import { createNotification } from '@/lib/notify'
import { getPlatformSettings } from '@/lib/platformSettings'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSiteAdmin = session.user.roles?.includes('site_admin')
  const isAdmin = session.user.roles?.includes('admin')
  if (!isSiteAdmin && !isAdmin) {
    const { scheduleReadOnly } = await getPlatformSettings()
    if (scheduleReadOnly) return NextResponse.json({ error: 'Schedule registration is currently unavailable.' }, { status: 403 })
  }

  const { classSessionId } = await req.json()
  if (!classSessionId) return NextResponse.json({ error: 'classSessionId required' }, { status: 400 })

  const existing = await prisma.commitment.findUnique({
    where: { userId_classSessionId: { userId: session.user.id, classSessionId } },
  })
  if (existing) return NextResponse.json(existing)

  const [user, classSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { weightClass: true, blockedClassGroups: true, blockedProgramIds: true },
    }),
    prisma.classSession.findUnique({
      where: { id: classSessionId },
      select: {
        date: true,
        class: { select: { title: true, startTime: true, type: true, programId: true, forum: { select: { id: true } } } },
      },
    }),
  ])

  // Class-group access: legacy fixed group (demo gym) OR gym-defined class group.
  const group = classSession ? classTypeToGroup(classSession.class.type) : null
  const progId = classSession?.class.programId ?? null
  const blockedByGroup = group ? !!user?.blockedClassGroups?.includes(group as any) : false
  const blockedByProgram = progId ? !!user?.blockedProgramIds?.includes(progId) : false
  if (blockedByGroup || blockedByProgram) {
    return NextResponse.json({ error: 'This class is not included in your membership.' }, { status: 403 })
  }

  const commitment = await prisma.commitment.create({
    data: {
      userId: session.user.id,
      classSessionId,
      weightClass: user?.weightClass ?? null,
    },
  })

  // Same-day check-in reminder (push is sent inside createNotification)
  if (classSession && isInCheckinWindow(classSession.date)) {
    const title = classSession.class.title
    const time = classSession.class.startTime
    createNotification(session.user.id, 'checkin_prompt', `You have ${title} today at ${time}`, {
      body: 'Tap to check in when you arrive.',
      link: '/schedule',
    }).catch(() => {})
  }

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
