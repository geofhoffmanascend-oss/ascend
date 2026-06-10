import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { recomputeInstructorRating } from '@/lib/reviews'

// POST /api/lessons/[id]/review — Phase 56. The requester of a COMPLETED lesson
// leaves one rating (1-5) + optional comment about the instructor.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const lesson = await prisma.privateLesson.findUnique({
    where: { id },
    select: { id: true, requesterId: true, instructorId: true, status: true, review: { select: { id: true } } },
  })
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lesson.requesterId !== session.user.id) {
    return NextResponse.json({ error: 'Only the student who took the lesson can review it.' }, { status: 403 })
  }
  if (lesson.status !== 'completed') {
    return NextResponse.json({ error: 'You can only review a completed lesson.' }, { status: 409 })
  }
  if (lesson.review) {
    return NextResponse.json({ error: 'You already reviewed this lesson.' }, { status: 409 })
  }

  const { rating, comment } = (await req.json().catch(() => ({}))) as { rating?: number; comment?: string }
  const r = Math.round(Number(rating))
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: 'Rating must be 1 to 5.' }, { status: 400 })
  }

  await prisma.instructorReview.create({
    data: {
      lessonId: lesson.id,
      instructorId: lesson.instructorId,
      reviewerId: session.user.id,
      rating: r,
      comment: comment?.trim() || null,
    },
  })
  await recomputeInstructorRating(lesson.instructorId)

  await createNotification(lesson.instructorId, 'general', 'New lesson review', {
    body: `${session.user.name ?? 'A student'} left you a ${r}-star review.`,
    link: `/profile/${lesson.instructorId}`,
  }).catch(() => {})

  return NextResponse.json({ success: true }, { status: 201 })
}
