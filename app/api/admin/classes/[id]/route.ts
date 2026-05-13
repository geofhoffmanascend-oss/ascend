import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { title, type, dayOfWeek, startTime, endTime, location, instructorId, maxStudents, isActive } = await req.json()

  if (title !== undefined) {
    const existing = await prisma.class.findFirst({
      where: { title: { equals: title.trim(), mode: 'insensitive' }, NOT: { id } },
    })
    if (existing) return NextResponse.json({ error: `A class named "${existing.title}" already exists.` }, { status: 409 })
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
    },
  })
  return NextResponse.json(cls)
}
