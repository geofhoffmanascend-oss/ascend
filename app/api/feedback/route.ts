import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { FeedbackSentiment } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const classSessionId = req.nextUrl.searchParams.get('classSessionId')
  if (!classSessionId) return NextResponse.json({ error: 'classSessionId required' }, { status: 400 })

  const feedback = await prisma.classFeedback.findMany({
    where: { classSessionId },
    include: { user: { select: { name: true, belt: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(feedback)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { classSessionId, sentiment, rating, responses, reviewRequested, anonymous } = await req.json()

  if (!classSessionId || !sentiment) {
    return NextResponse.json({ error: 'classSessionId and sentiment required' }, { status: 400 })
  }

  const feedback = await prisma.classFeedback.upsert({
    where: { userId_classSessionId: { userId: session.user.id, classSessionId } },
    create: {
      userId: session.user.id,
      classSessionId,
      sentiment: sentiment as FeedbackSentiment,
      rating: rating ?? null,
      responses: responses ?? [],
      reviewRequested: !!reviewRequested,
      anonymous: !!anonymous,
    },
    update: {
      sentiment: sentiment as FeedbackSentiment,
      rating: rating ?? null,
      responses: responses ?? [],
      reviewRequested: !!reviewRequested,
      anonymous: !!anonymous,
    },
  })

  return NextResponse.json(feedback, { status: 201 })
}
