import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const log = await prisma.trainingLog.findUnique({
    where: { id },
    include: {
      classSession: { select: { date: true, class: { select: { title: true, instructorId: true } } } },
    },
  })

  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = log.userId === session.user.id
  const isInstructor =
    !log.isPrivate &&
    (session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')) &&
    log.classSession?.class.instructorId === session.user.id

  if (!isOwner && !isInstructor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(log)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.trainingLog.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { title, isPrivate, isGuided, freeFormContent, guidedResponses } = await req.json()

  const log = await prisma.trainingLog.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(isPrivate !== undefined && { isPrivate }),
      ...(isGuided !== undefined && { isGuided }),
      ...(freeFormContent !== undefined && { freeFormContent }),
      ...(guidedResponses !== undefined && { guidedResponses }),
    },
  })

  return NextResponse.json(log)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.trainingLog.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.trainingLog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
