import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/instructorAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireInstructor()
  if (error) return error

  const { id } = await params
  const { title, body, userIds } = await req.json()

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const cs = await prisma.classSession.findUnique({
    where: { id },
    select: { class: { select: { instructorId: true, gymId: true } } },
  })
  if (!cs) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = cs.class.instructorId === session!.user.id ||
    (!!session!.user.roles?.includes('admin') && cs.class.gymId === session!.user.gymId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If specific userIds provided, use those; otherwise all committed students
  let targetIds: string[] = userIds ?? []
  if (!targetIds.length) {
    const commitments = await prisma.commitment.findMany({
      where: { classSessionId: id },
      select: { userId: true },
    })
    targetIds = commitments.map(c => c.userId)
  }

  await Promise.all(
    targetIds.map(async uid => {
      // push is sent inside createNotification
      await createNotification(uid, 'class_update', title.trim(), {
        body: body?.trim() || undefined,
        link: `/schedule`,
      })
    })
  )

  return NextResponse.json({ sent: targetIds.length })
}
