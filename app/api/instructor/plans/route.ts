import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { title, techniques, notes, videoUrls, classId } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const plan = await prisma.lessonPlan.create({
    data: {
      instructorId: session!.user.id,
      title: title.trim(),
      techniques: techniques?.trim() || null,
      notes: notes?.trim() || null,
      videoUrls: videoUrls ? JSON.stringify(videoUrls) : null,
      classId: classId || null,
    },
  })
  return NextResponse.json(plan, { status: 201 })
}
