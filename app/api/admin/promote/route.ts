import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { studentId, belt, stripes, date, notes } = await req.json()
  if (!studentId || !belt || stripes === undefined || !date) {
    return NextResponse.json({ error: 'studentId, belt, stripes, and date required' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.rankPromotion.create({
      data: {
        studentId,
        promotedById: session!.user.id,
        belt,
        stripes,
        date: new Date(date),
        notes: notes?.trim() || null,
      },
    }),
    prisma.user.update({
      where: { id: studentId },
      data: { belt, stripes },
    }),
  ])

  return NextResponse.json({ success: true }, { status: 201 })
}
