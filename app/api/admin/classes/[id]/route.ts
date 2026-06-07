import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForClass } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, session } = await requireAdminForClass(id)
  if (error) return error

  const gymId = session.user.gymId ?? null
  const { title, description, type, dayOfWeek, startTime, endTime, location, instructorId, maxStudents, isActive, programId } = await req.json()

  // Duplicate check is scoped to the same gym AND the same day — the same title
  // may repeat on different days. Effective day = the new day (if changing) else
  // the class's current day.
  if (title !== undefined || dayOfWeek !== undefined) {
    const current = await prisma.class.findUnique({ where: { id }, select: { title: true, dayOfWeek: true } })
    const checkTitle = (title ?? current?.title ?? '').trim()
    const checkDay = dayOfWeek ?? current?.dayOfWeek
    if (checkTitle && checkDay) {
      const existing = await prisma.class.findFirst({
        where: { gymId, dayOfWeek: checkDay, title: { equals: checkTitle, mode: 'insensitive' }, NOT: { id } },
      })
      if (existing) return NextResponse.json({ error: `A class named "${existing.title}" already exists on that day.` }, { status: 409 })
    }
  }

  // Validate program belongs to this gym (if provided); '' clears it.
  let programUpdate: { programId?: string | null } = {}
  if (programId !== undefined) {
    if (programId) {
      const program = await prisma.classProgram.findUnique({ where: { id: programId }, select: { gymId: true } })
      if (!program || program.gymId !== gymId) return NextResponse.json({ error: 'Invalid class group' }, { status: 400 })
      programUpdate = { programId }
    } else {
      programUpdate = { programId: null }
    }
  }

  const cls = await prisma.class.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
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

// DELETE /api/admin/classes/[id] — permanently delete a class. Cascades to its
// sessions (and their commitments/attendance/feedback) and its class forum;
// lesson plans detach. Gym-scoped via requireAdminForClass.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdminForClass(id)
  if (error) return error

  try {
    await prisma.class.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/admin/classes/[id] DELETE]', err)
    return NextResponse.json({ error: 'Could not delete this class.' }, { status: 500 })
  }
}
