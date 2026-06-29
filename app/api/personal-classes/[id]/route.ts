import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { ClassType, DayOfWeek } from '@prisma/client'
import { DAY_VALUES, CLASS_TYPE_VALUES, isValidTime } from '@/lib/personalTraining'

async function ownedOr404(id: string, userId: string) {
  const pc = await prisma.personalClass.findUnique({ where: { id }, select: { userId: true } })
  if (!pc || pc.userId !== userId) return false
  return true
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!(await ownedOr404(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (body.label !== undefined) {
    if (typeof body.label !== 'string' || !body.label.trim()) {
      return NextResponse.json({ error: 'Label cannot be empty.' }, { status: 400 })
    }
    data.label = body.label.trim().slice(0, 80)
  }
  if (body.dayOfWeek !== undefined) {
    if (!DAY_VALUES.includes(body.dayOfWeek)) return NextResponse.json({ error: 'Invalid day.' }, { status: 400 })
    data.dayOfWeek = body.dayOfWeek as DayOfWeek
  }
  if (body.startTime !== undefined) {
    if (!isValidTime(body.startTime)) return NextResponse.json({ error: 'Invalid start time.' }, { status: 400 })
    data.startTime = body.startTime
  }
  if (body.endTime !== undefined) {
    if (body.endTime && !isValidTime(body.endTime)) return NextResponse.json({ error: 'Invalid end time.' }, { status: 400 })
    data.endTime = body.endTime || null
  }
  if (body.type !== undefined) {
    if (!CLASS_TYPE_VALUES.includes(body.type)) return NextResponse.json({ error: 'Invalid type.' }, { status: 400 })
    data.type = body.type as ClassType
  }
  if (body.location !== undefined) {
    data.location = typeof body.location === 'string' && body.location.trim() ? body.location.trim().slice(0, 120) : null
  }

  const updated = await prisma.personalClass.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!(await ownedOr404(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Soft-delete so historical self check-ins keep their (now-detached) link cleanly.
  await prisma.personalClass.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
