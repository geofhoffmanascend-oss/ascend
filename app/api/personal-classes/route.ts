import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { ClassType, DayOfWeek } from '@prisma/client'
import { DAY_VALUES, CLASS_TYPE_VALUES, isValidTime } from '@/lib/personalTraining'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classes = await prisma.personalClass.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { label, type, dayOfWeek, startTime, endTime, location } = body

  if (typeof label !== 'string' || !label.trim()) {
    return NextResponse.json({ error: 'A label is required.' }, { status: 400 })
  }
  if (!DAY_VALUES.includes(dayOfWeek)) {
    return NextResponse.json({ error: 'A valid day is required.' }, { status: 400 })
  }
  if (!isValidTime(startTime)) {
    return NextResponse.json({ error: 'A valid start time (HH:MM) is required.' }, { status: 400 })
  }
  if (endTime != null && endTime !== '' && !isValidTime(endTime)) {
    return NextResponse.json({ error: 'End time must be HH:MM.' }, { status: 400 })
  }
  if (type != null && !CLASS_TYPE_VALUES.includes(type)) {
    return NextResponse.json({ error: 'Invalid class type.' }, { status: 400 })
  }

  const created = await prisma.personalClass.create({
    data: {
      userId: session.user.id,
      label: label.trim().slice(0, 80),
      type: (type as ClassType) ?? ClassType.gi,
      dayOfWeek: dayOfWeek as DayOfWeek,
      startTime,
      endTime: endTime || null,
      location: typeof location === 'string' && location.trim() ? location.trim().slice(0, 120) : null,
    },
  })
  return NextResponse.json(created, { status: 201 })
}
