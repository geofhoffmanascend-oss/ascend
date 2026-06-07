import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId ?? null

  const { title, description, type, dayOfWeek, startTime, endTime, location, instructorId, maxStudents, isActive, programId } = await req.json()
  if (!title?.trim() || !type || !dayOfWeek || !startTime || !endTime || !instructorId) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  // Duplicate check scoped to THIS gym AND the same day — the same title may
  // repeat on different days (e.g. "6am Gi" Mon/Tue/Wed).
  const existing = await prisma.class.findFirst({ where: { gymId, dayOfWeek, title: { equals: title.trim(), mode: 'insensitive' } } })
  if (existing) return NextResponse.json({ error: `A class named "${existing.title}" already exists on that day.` }, { status: 409 })

  // Validate program belongs to this gym (if provided)
  let resolvedProgramId: string | null = null
  if (programId) {
    const program = await prisma.classProgram.findUnique({ where: { id: programId }, select: { gymId: true } })
    if (!program || program.gymId !== gymId) return NextResponse.json({ error: 'Invalid class group' }, { status: 400 })
    resolvedProgramId = programId
  }

  // Auto-create a class forum
  const cls = await prisma.class.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      type,
      dayOfWeek,
      startTime,
      endTime,
      location: location?.trim() || null,
      instructorId,
      maxStudents: maxStudents ? Number(maxStudents) : null,
      isActive: isActive ?? true,
      gymId,
      programId: resolvedProgramId,
    },
  })

  await prisma.forum.create({
    data: {
      type: 'class_forum',
      title: `${cls.title} Forum`,
      classId: cls.id,
      gymId,
    },
  })

  return NextResponse.json(cls, { status: 201 })
}
