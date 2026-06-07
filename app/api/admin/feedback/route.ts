import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId ?? null

  const sentiment = req.nextUrl.searchParams.get('sentiment')
  const classId   = req.nextUrl.searchParams.get('classId')

  const feedback = await prisma.classFeedback.findMany({
    where: {
      // Scope to THIS gym's classes (multi-tenancy).
      classSession: { class: { gymId, ...(classId && { id: classId }) } },
      ...(sentiment && { sentiment: sentiment as never }),
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
