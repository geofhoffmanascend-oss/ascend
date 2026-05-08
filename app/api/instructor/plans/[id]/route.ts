import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params
  const plan = await prisma.lessonPlan.findUnique({ where: { id } })
  if (!plan || plan.instructorId !== session!.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { title, techniques, notes, videoUrls, classId } = await req.json()
  const updated = await prisma.lessonPlan.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(techniques !== undefined && { techniques: techniques?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(videoUrls !== undefined && { videoUrls: JSON.stringify(videoUrls) }),
      ...(classId !== undefined && { classId: classId || null }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params
  const plan = await prisma.lessonPlan.findUnique({ where: { id } })
  if (!plan || plan.instructorId !== session!.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.lessonPlan.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
