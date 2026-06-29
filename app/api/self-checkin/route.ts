import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { todayDateOnly } from '@/lib/personalTraining'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const checkIns = await prisma.selfCheckIn.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 60,
    include: { personalClass: { select: { label: true, isActive: true } } },
  })
  return NextResponse.json(checkIns)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Date: default today; accept an explicit yyyy-mm-dd (no future dates).
  let date = todayDateOnly()
  if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    const parsed = new Date(`${body.date}T00:00:00Z`)
    if (!Number.isNaN(parsed.getTime()) && parsed <= todayDateOnly()) date = parsed
  }

  let personalClassId: string | null = null
  let label: string | null =
    typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : null

  if (typeof body.personalClassId === 'string' && body.personalClassId) {
    const pc = await prisma.personalClass.findUnique({
      where: { id: body.personalClassId },
      select: { userId: true, label: true },
    })
    if (!pc || pc.userId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid class.' }, { status: 400 })
    }
    personalClassId = body.personalClassId
    if (!label) label = pc.label
  }

  // Dedupe: same day + same slot (or same day ad-hoc) shouldn't double-count.
  const existing = await prisma.selfCheckIn.findFirst({
    where: { userId: session.user.id, date, personalClassId },
    select: { id: true },
  })
  if (existing) return NextResponse.json(existing, { status: 200 })

  const created = await prisma.selfCheckIn.create({
    data: {
      userId: session.user.id,
      date,
      personalClassId,
      label,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 280) : null,
    },
  })
  return NextResponse.json(created, { status: 201 })
}
