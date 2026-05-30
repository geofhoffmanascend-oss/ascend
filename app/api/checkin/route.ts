import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { isInCheckinWindow, recordCheckin } from '@/lib/checkin'
import { classTypeToGroup } from '@/lib/classGroups'
import { getPlatformSettings } from '@/lib/platformSettings'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSiteAdmin = session.user.roles?.includes('site_admin')
  const isAdmin = session.user.roles?.includes('admin')
  if (!isSiteAdmin && !isAdmin) {
    const { scheduleReadOnly } = await getPlatformSettings()
    if (scheduleReadOnly) return NextResponse.json({ error: 'Check-in is currently unavailable.' }, { status: 403 })
  }

  const { classSessionId } = await req.json()
  if (!classSessionId) return NextResponse.json({ error: 'classSessionId required' }, { status: 400 })

  const classSession = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    include: { class: { select: { startTime: true, type: true } } },
  })
  if (!classSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { blockedClassGroups: true } })
  const group = classTypeToGroup(classSession.class.type)
  if (group && user?.blockedClassGroups?.includes(group as any)) {
    return NextResponse.json({ error: 'This class is not included in your membership.' }, { status: 403 })
  }

  const commitment = await prisma.commitment.findUnique({
    where: { userId_classSessionId: { userId: session.user.id, classSessionId } },
  })
  if (!commitment) {
    return NextResponse.json({ error: 'You are not committed to this class.' }, { status: 403 })
  }

  if (!isInCheckinWindow(classSession.date)) {
    return NextResponse.json(
      { error: 'Check-in is only available on the day of the class.' },
      { status: 400 },
    )
  }

  const attendance = await recordCheckin(session.user.id, classSessionId, 'app')
  return NextResponse.json(attendance, { status: 201 })
}
