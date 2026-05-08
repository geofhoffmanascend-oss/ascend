import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function GET(req: NextRequest) {
  await requireAdmin()

  const sentiment = req.nextUrl.searchParams.get('sentiment')
  const classId   = req.nextUrl.searchParams.get('classId')

  const feedback = await prisma.classFeedback.findMany({
    where: {
      ...(sentiment && { sentiment: sentiment as never }),
      ...(classId && { classSession: { classId } }),
    },
    include: {
      user: { select: { name: true, belt: true } },
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(feedback)
}
