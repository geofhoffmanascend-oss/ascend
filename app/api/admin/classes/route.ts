import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { title, type, dayOfWeek, startTime, endTime, location, instructorId, maxStudents, isActive } = await req.json()
  if (!title?.trim() || !type || !dayOfWeek || !startTime || !endTime || !instructorId) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const existing = await prisma.class.findFirst({ where: { title: { equals: title.trim(), mode: 'insensitive' } } })
  if (existing) return NextResponse.json({ error: `A class named "${existing.title}" already exists.` }, { status: 409 })

  // Auto-create a class forum
  const cls = await prisma.class.create({
    data: {
      title: title.trim(),
      type,
      dayOfWeek,
      startTime,
      endTime,
      location: location?.trim() || null,
      instructorId,
      maxStudents: maxStudents ? Number(maxStudents) : null,
      isActive: isActive ?? true,
    },
  })

  await prisma.forum.create({
    data: {
      type: 'class_forum',
      title: `${cls.title} Forum`,
      classId: cls.id,
    },
  })

  return NextResponse.json(cls, { status: 201 })
}
