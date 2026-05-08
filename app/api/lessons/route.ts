import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { instructorId, scheduledAt, durationMins, ukeId, location, notes } = await req.json()
  if (!instructorId || !scheduledAt) {
    return NextResponse.json({ error: 'instructorId and scheduledAt required' }, { status: 400 })
  }

  const lesson = await prisma.privateLesson.create({
    data: {
      requesterId: session.user.id,
      instructorId,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins ?? 60,
      ukeId: ukeId || null,
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    },
  })

  const requesterName = session.user.name ?? 'A student'
  const dateLabel = new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  await createNotification(instructorId, 'general', `Private lesson request from ${requesterName}`, {
    body: `Requested for ${dateLabel}`,
    link: `/instructor/lessons`,
  })

  return NextResponse.json(lesson, { status: 201 })
}
