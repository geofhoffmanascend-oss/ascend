import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { studentId, content } = await req.json()
  if (!studentId || !content?.trim()) {
    return NextResponse.json({ error: 'studentId and content required' }, { status: 400 })
  }

  const note = await prisma.studentNote.create({
    data: { studentId, instructorId: session!.user.id, content: content.trim() },
  })
  return NextResponse.json(note, { status: 201 })
}
