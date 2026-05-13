import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params
  const { sessionNotes, notesPublic } = await req.json()

  const cs = await prisma.classSession.findUnique({
    where: { id },
    select: { class: { select: { instructorId: true } } },
  })
  if (!cs) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!session!.user.roles?.includes('admin') && cs.class.instructorId !== session!.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.classSession.update({
    where: { id },
    data: {
      sessionNotes: sessionNotes?.trim() || null,
      notesPublic: Boolean(notesPublic),
    },
  })

  return NextResponse.json({ success: true })
}
