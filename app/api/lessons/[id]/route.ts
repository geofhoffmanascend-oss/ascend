import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

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
  return NextResponse.json(updated)
}
