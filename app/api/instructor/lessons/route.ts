import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { studentId, ukeId, scheduledAt, durationMins, location, notes, price } = await req.json()

  if (!studentId || !scheduledAt) {
    return NextResponse.json({ error: 'studentId and scheduledAt required' }, { status: 400 })
  }

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const lesson = await prisma.privateLesson.create({
    data: {
      requesterId: studentId,
      instructorId: session!.user.id,
      ukeId: ukeId || null,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins ?? 60,
      location: location?.trim() || null,
      notes: notes?.trim() || null,
      price: price ?? null,
      status: 'confirmed',
    },
  })

  const dateLabel = new Date(scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const timeLabel = new Date(scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  await createNotification(studentId, 'class_update',
    `Private lesson scheduled`,
    {
      body: `${session!.user.name ?? 'Your instructor'} scheduled a lesson with you — ${dateLabel} at ${timeLabel}`,
      link: `/lessons/${lesson.id}`,
    },
  )

  if (ukeId) {
    await createNotification(ukeId, 'class_update',
      `Private lesson scheduled`,
      {
        body: `${session!.user.name ?? 'Your instructor'} scheduled a lesson — ${dateLabel} at ${timeLabel}`,
        link: `/lessons/${lesson.id}`,
      },
    )
  }

  return NextResponse.json({ lessonId: lesson.id }, { status: 201 })
}
