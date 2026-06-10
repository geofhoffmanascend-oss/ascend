import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { studentId, content } = await req.json()
  if (!studentId || !content?.trim()) {
    return NextResponse.json({ error: 'studentId and content required' }, { status: 400 })
  }

  // Only note a student at your own gym (multi-tenancy; site admins bypass).
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { gymId: true } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  if (!session!.user.roles?.includes('site_admin') && student.gymId !== session!.user.gymId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const note = await prisma.studentNote.create({
    data: { studentId, instructorId: session!.user.id, content: content.trim() },
  })

  const instructorName = session!.user.name ?? 'Your instructor'
  await createNotification(studentId, 'instructor_note', `Note from ${instructorName}`, {
    body: content.trim().slice(0, 100),
    link: '/profile',
  })

  return NextResponse.json(note, { status: 201 })
}
