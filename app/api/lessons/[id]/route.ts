import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
  pending:   'updated',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const lesson = await prisma.privateLesson.findUnique({ where: { id } })
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = lesson.requesterId === session.user.id || lesson.instructorId === session.user.id
  if (!isParticipant && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status, scheduledAt, notes, location } = await req.json()
  const updated = await prisma.privateLesson.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      ...(notes !== undefined && { notes }),
      ...(location !== undefined && { location }),
    },
  })

  // Notify the other participant when something meaningful changes
  const actorName = session.user.name ?? 'Your instructor'
  if (status !== undefined) {
    const notifyId = session.user.id === lesson.instructorId ? lesson.requesterId : lesson.instructorId
    const label = STATUS_LABELS[status] ?? 'updated'
    await createNotification(notifyId, 'general', `Private lesson ${label}`, {
      body: `${actorName} ${label} your lesson request.`,
      link: `/lessons/${id}`,
    })
  } else if (scheduledAt !== undefined) {
    const notifyId = session.user.id === lesson.instructorId ? lesson.requesterId : lesson.instructorId
    const dateLabel = new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    await createNotification(notifyId, 'general', 'Lesson rescheduled', {
      body: `${actorName} changed the time to ${dateLabel}.`,
      link: `/lessons/${id}`,
    })
  }

  return NextResponse.json(updated)
}
