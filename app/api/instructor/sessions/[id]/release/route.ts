import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params
  const { note } = await req.json().catch(() => ({}))

  const cs = await prisma.classSession.findUnique({
    where: { id },
    include: {
      class: { select: { title: true, instructorId: true, gymId: true, startTime: true } },
      subRequests: { where: { status: 'open' } },
    },
  })
  if (!cs) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = cs.class.instructorId === session!.user.id ||
    (!!session!.user.roles?.includes('admin') && cs.class.gymId === session!.user.gymId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (cs.subRequests.length > 0) {
    return NextResponse.json({ error: 'Sub request already open' }, { status: 409 })
  }

  const subReq = await prisma.classSubRequest.create({
    data: {
      classSessionId: id,
      requestedById: session!.user.id,
      note: note?.trim() || null,
    },
  })

  const dateLabel = cs.date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })

  // Notify all other instructors
  const instructors = await prisma.user.findMany({
    where: {
      roles: { has: 'instructor' as any },
      id: { not: session!.user.id },
    },
    select: { id: true },
  })

  await Promise.all(
    instructors.map(i =>
      createNotification(i.id, 'class_update',
        `Sub needed: ${cs.class.title}`,
        {
          body: `${dateLabel} · ${cs.class.startTime}${note ? ` — "${note}"` : ''}`,
          link: `/instructor/sub-requests`,
        },
      )
    )
  )

  return NextResponse.json({ subReqId: subReq.id }, { status: 201 })
}
