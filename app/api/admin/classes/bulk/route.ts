import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { DayOfWeek } from '@prisma/client'

const VALID_DAYS = Object.values(DayOfWeek)

// POST /api/admin/classes/bulk — create one class per selected day (Phase 52).
// Same title/time/instructor/program across days; each day is its own Class row
// with its own class_forum. Dup rule: block (title, day) collisions per gym;
// allow the same title across different days.
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId ?? null

  const body = await req.json()
  const { title, description, type, startTime, endTime, location, instructorId, maxStudents, isActive, programId, days } = body

  if (!title?.trim() || !type || !startTime || !endTime || !instructorId) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }
  if (!Array.isArray(days) || days.length === 0 || days.some((d: string) => !VALID_DAYS.includes(d as DayOfWeek))) {
    return NextResponse.json({ error: 'Select at least one valid day' }, { status: 400 })
  }

  // Validate the program belongs to this gym (if provided)
  let resolvedProgramId: string | null = null
  if (programId) {
    const program = await prisma.classProgram.findUnique({ where: { id: programId }, select: { gymId: true } })
    if (!program || program.gymId !== gymId) {
      return NextResponse.json({ error: 'Invalid class group' }, { status: 400 })
    }
    resolvedProgramId = programId
  }

  const cleanTitle = title.trim()
  const uniqueDays = Array.from(new Set(days)) as DayOfWeek[]

  // Find existing (title, day) collisions for this gym
  const existing = await prisma.class.findMany({
    where: { gymId, title: { equals: cleanTitle, mode: 'insensitive' }, dayOfWeek: { in: uniqueDays } },
    select: { dayOfWeek: true },
  })
  const takenDays = new Set(existing.map(e => e.dayOfWeek))
  const daysToCreate = uniqueDays.filter(d => !takenDays.has(d))

  if (daysToCreate.length === 0) {
    return NextResponse.json({ error: `"${cleanTitle}" already exists on the selected day(s).` }, { status: 409 })
  }

  const created = await prisma.$transaction(
    daysToCreate.map(day =>
      prisma.class.create({
        data: {
          title: cleanTitle,
          description: description?.trim() || null,
          type,
          dayOfWeek: day,
          startTime,
          endTime,
          location: location?.trim() || null,
          instructorId,
          maxStudents: maxStudents ? Number(maxStudents) : null,
          isActive: isActive ?? true,
          gymId,
          programId: resolvedProgramId,
          forum: { create: { type: 'class_forum', title: `${cleanTitle} Forum`, gymId } },
        },
        select: { id: true, dayOfWeek: true },
      }),
    ),
  )

  return NextResponse.json({
    created: created.length,
    skipped: Array.from(takenDays),
  }, { status: 201 })
}
