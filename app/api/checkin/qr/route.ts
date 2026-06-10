import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { isInCheckinWindow, recordCheckin } from '@/lib/checkin'
import { classTypeToGroup } from '@/lib/classGroups'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Instructor or admin required' }, { status: 403 })
  }

  const { qrToken, classSessionId } = await req.json()
  if (!qrToken) return NextResponse.json({ error: 'qrToken required' }, { status: 400 })

  const student = await prisma.user.findUnique({
    where: { qrToken },
    select: { id: true, name: true, gymId: true, blockedClassGroups: true, blockedProgramIds: true },
  })
  if (!student) return NextResponse.json({ error: 'Unknown QR code' }, { status: 404 })

  let resolvedSessionId = classSessionId as string | undefined

  if (!resolvedSessionId) {
    // Find the next committed session for this student that's currently in check-in window
    const commitments = await prisma.commitment.findMany({
      where: { userId: student.id },
      include: { classSession: { include: { class: { select: { startTime: true } } } } },
    })
    const now = new Date()
    const match = commitments.find(c =>
      isInCheckinWindow(c.classSession.date, now)
    )
    if (!match) {
      return NextResponse.json({ error: 'No class today for this student.' }, { status: 400 })
    }
    resolvedSessionId = match.classSessionId
  }

  const classSession = await prisma.classSession.findUnique({
    where: { id: resolvedSessionId },
    include: { class: { select: { startTime: true, title: true, type: true, programId: true, gymId: true } } },
  })
  if (!classSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // The scanning instructor/admin can only check students into their own gym's
  // sessions (site admins bypass; multi-tenancy).
  if (!session.user.roles?.includes('site_admin') && classSession.class.gymId !== (session.user.gymId ?? null)) {
    return NextResponse.json({ error: 'You can only check in at your own gym.' }, { status: 403 })
  }

  if (classSession.class.gymId !== (student.gymId ?? null)) {
    return NextResponse.json({ error: `${student.name} is not a member of this gym.` }, { status: 403 })
  }

  const group = classTypeToGroup(classSession.class.type)
  const progId = classSession.class.programId
  const blockedByGroup = group ? !!student.blockedClassGroups?.includes(group as any) : false
  const blockedByProgram = progId ? !!student.blockedProgramIds?.includes(progId) : false
  if (blockedByGroup || blockedByProgram) {
    return NextResponse.json({ error: `${student.name} does not have access to this class.` }, { status: 403 })
  }

  if (!isInCheckinWindow(classSession.date)) {
    return NextResponse.json({ error: 'Check-in is only available on the day of the class.' }, { status: 400 })
  }

  await recordCheckin(student.id, resolvedSessionId, 'qr_code')

  return NextResponse.json({
    ok: true,
    student: student.name,
    class: classSession.class.title,
  })
}
