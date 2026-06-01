import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { getEffectiveFeatures } from '@/lib/features'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classSessionId = req.nextUrl.searchParams.get('classSessionId')

  const logs = await prisma.trainingLog.findMany({
    where: {
      userId: session.user.id,
      ...(classSessionId && { classSessionId }),
    },
    include: {
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { journal } = await getEffectiveFeatures(session)
  if (!journal) return NextResponse.json({ error: 'The training journal is not available for your gym.' }, { status: 403 })

  const { classSessionId, title, isPrivate, isGuided, freeFormContent, guidedResponses } = await req.json()

  const log = await prisma.trainingLog.create({
    data: {
      userId: session.user.id,
      classSessionId: classSessionId || null,
      title: title || null,
      isPrivate: !!isPrivate,
      isGuided: !!isGuided,
      freeFormContent: freeFormContent || null,
      guidedResponses: guidedResponses || null,
    },
  })

  return NextResponse.json(log, { status: 201 })
}
