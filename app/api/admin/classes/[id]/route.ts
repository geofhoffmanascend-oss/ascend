import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForClass } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, session } = await requireAdminForClass(id)
  if (error) return error

  const gymId = session.user.gymId ?? null
  const { title, type, dayOfWeek, startTime, endTime, location, instructorId, maxStudents, isActive, programId } = await req.json()

  if (title !== undefined) {
    const existing = await prisma.class.findFirst({
      where: { gymId, title: { equals: title.trim(), mode: 'insensitive' }, NOT: { id } },
    })
    if (existing) return NextResponse.json({ error: `A class named "${existing.title}" already exists.` }, { status: 409 })
  }

  // Validate program belongs to this gym (if provided); '' clears it.
  let programUpdate: { programId?: string | null } = {}
  if (programId !== undefined) {
    if (programId) {
      const program = await prisma.classProgram.findUnique({ where: { id: programId }, select: { gymId: true } })
      if (!program || program.gymId !== gymId) return NextResponse.json({ error: 'Invalid program' }, { status: 400 })
      programUpdate = { programId }
    } else {
      programUpdate = { programId: null }
    }
  }

  const cls = await prisma.class.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(type !== undefined && { type }),
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(instructorId !== undefined && { instructorId }),
      ...(maxStudents !== undefined && { maxStudents: maxStudents ? Number(maxStudents) : null }),
      ...(isActive !== undefined && { isActive }),
      ...programUpdate,
    },
  })
  return NextResponse.json(cls)
}
