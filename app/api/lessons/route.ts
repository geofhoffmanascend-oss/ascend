import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

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
  return NextResponse.json(lesson, { status: 201 })
}
