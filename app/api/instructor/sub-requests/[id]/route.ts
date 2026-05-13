import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// Claim a sub request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params

  const subReq = await prisma.classSubRequest.findUnique({
    where: { id },
    include: {
      classSession: {
        include: { class: { select: { title: true, startTime: true } } },
      },
      requestedBy: { select: { id: true } },
    },
  })

  if (!subReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (subReq.status !== 'open') return NextResponse.json({ error: 'Already filled or cancelled' }, { status: 409 })
  if (subReq.requestedById === session!.user.id) {
    return NextResponse.json({ error: 'Cannot claim your own release' }, { status: 400 })
  }

  await prisma.classSubRequest.update({
    where: { id },
    data: { status: 'filled', claimedById: session!.user.id },
  })

  const dateLabel = subReq.classSession.date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })

  // Notify the original instructor
  await createNotification(
    subReq.requestedBy.id,
    'class_update',
    `Sub confirmed: ${subReq.classSession.class.title}`,
    {
      body: `${session!.user.name ?? 'An instructor'} will cover ${dateLabel} · ${subReq.classSession.class.startTime}`,
      link: `/instructor/sub-requests`,
    },
  )

  return NextResponse.json({ success: true })
}

// Cancel a sub request (original instructor reclaims)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params

  const subReq = await prisma.classSubRequest.findUnique({ where: { id }, select: { requestedById: true, status: true } })
  if (!subReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!session!.user.roles?.includes('admin') && subReq.requestedById !== session!.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.classSubRequest.update({ where: { id }, data: { status: 'cancelled' } })
  return NextResponse.json({ success: true })
}
