import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params
  const note = await prisma.studentNote.findUnique({ where: { id } })
  if (!note || note.instructorId !== session!.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.studentNote.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
