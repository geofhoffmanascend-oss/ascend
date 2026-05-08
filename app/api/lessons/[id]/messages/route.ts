import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: lessonId } = await params
  const lesson = await prisma.privateLesson.findUnique({ where: { id: lessonId } })
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = lesson.requesterId === session.user.id || lesson.instructorId === session.user.id
  if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const message = await prisma.lessonMessage.create({
    data: { lessonId, authorId: session.user.id, content: content.trim() },
  })

  // Notify the other participant
  const recipientId = session.user.id === lesson.instructorId ? lesson.requesterId : lesson.instructorId
  const senderName = session.user.name ?? 'Someone'
  await createNotification(recipientId, 'private_message', `New message from ${senderName}`, {
    body: content.trim().slice(0, 80),
    link: `/lessons/${lessonId}`,
  })

  return NextResponse.json({ ...message, author: { name: session.user.name } }, { status: 201 })
}
