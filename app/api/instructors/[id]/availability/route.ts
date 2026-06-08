import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { availabilityInRange } from '@/lib/availability'

// GET /api/instructors/[id]/availability?weeks=4 — bookable private-lesson slots
// for an instructor over the next N weeks (recurring + one-off − blocks − booked).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const weeks = Math.min(8, Math.max(1, parseInt(req.nextUrl.searchParams.get('weeks') ?? '4', 10)))

  const from = new Date()
  from.setUTCHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setUTCDate(to.getUTCDate() + weeks * 7)

  const [entries, lessons] = await Promise.all([
    prisma.instructorAvailability.findMany({
      where: { instructorId: id },
      select: { kind: true, dayOfWeek: true, date: true, startTime: true, endTime: true },
    }),
    // Block out times already requested/confirmed (not cancelled).
    prisma.privateLesson.findMany({
      where: { instructorId: id, status: { in: ['pending', 'confirmed'] }, scheduledAt: { gte: from } },
      select: { scheduledAt: true, durationMins: true },
    }),
  ])

  const days = availabilityInRange(entries as any, lessons, from, to, 60)
  return NextResponse.json({ days })
}
