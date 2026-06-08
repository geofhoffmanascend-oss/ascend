import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { AvailabilityKind, DayOfWeek } from '@prisma/client'

const KINDS = Object.values(AvailabilityKind)
const DAYS = Object.values(DayOfWeek)

function isInstructor(roles?: string[]) {
  return !!roles && (roles.includes('instructor') || roles.includes('admin'))
}

// GET /api/instructor/availability — the current instructor's availability + acceptsOutsideOrg
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isInstructor(session.user.roles)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [entries, user] = await Promise.all([
    prisma.instructorAvailability.findMany({
      where: { instructorId: session.user.id },
      orderBy: [{ kind: 'asc' }, { dayOfWeek: 'asc' }, { date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { acceptsOutsideOrg: true } }),
  ])
  return NextResponse.json({ entries, acceptsOutsideOrg: user?.acceptsOutsideOrg ?? false })
}

// POST /api/instructor/availability — add one entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isInstructor(session.user.roles)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const kind = body.kind as AvailabilityKind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  if (!body.startTime || !body.endTime) return NextResponse.json({ error: 'Start and end time required' }, { status: 400 })

  if (kind === 'recurring') {
    if (!DAYS.includes(body.dayOfWeek)) return NextResponse.json({ error: 'Day required' }, { status: 400 })
  } else {
    if (!body.date) return NextResponse.json({ error: 'Date required' }, { status: 400 })
  }

  const entry = await prisma.instructorAvailability.create({
    data: {
      instructorId: session.user.id,
      kind,
      dayOfWeek: kind === 'recurring' ? body.dayOfWeek : null,
      date: kind === 'recurring' ? null : new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      gymId: session.user.gymId ?? null,
    },
  })
  return NextResponse.json({ entry }, { status: 201 })
}

// PUT /api/instructor/availability — toggle acceptsOutsideOrg
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isInstructor(session.user.roles)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { acceptsOutsideOrg } = await req.json()
  await prisma.user.update({ where: { id: session.user.id }, data: { acceptsOutsideOrg: !!acceptsOutsideOrg } })
  return NextResponse.json({ acceptsOutsideOrg: !!acceptsOutsideOrg })
}
