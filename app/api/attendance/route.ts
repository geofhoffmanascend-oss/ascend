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

  const record = await prisma.attendance.upsert({
    where: { userId_classSessionId: { userId, classSessionId } },
    create: { userId, classSessionId, attended: attended ?? true, markedById: session!.user.id },
    update: { attended: attended ?? true, markedById: session!.user.id },
  })

  return NextResponse.json(record)
}
