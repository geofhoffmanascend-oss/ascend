import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { classSessionId, userId, attended } = await req.json()
  if (!classSessionId || !userId) {
    return NextResponse.json({ error: 'classSessionId and userId required' }, { status: 400 })
  }

  // Only mark attendance for sessions at your own gym (multi-tenancy; site admins bypass).
  const cs = await prisma.classSession.findUnique({ where: { id: classSessionId }, select: { class: { select: { gymId: true } } } })
  if (!cs) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (!session!.user.roles?.includes('site_admin') && cs.class.gymId !== session!.user.gymId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const record = await prisma.attendance.upsert({
    where: { userId_classSessionId: { userId, classSessionId } },
    create: { userId, classSessionId, attended: attended ?? true, markedById: session!.user.id },
    update: { attended: attended ?? true, markedById: session!.user.id },
  })

  return NextResponse.json(record)
}
