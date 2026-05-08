import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { isInCheckinWindow, recordCheckin } from '@/lib/checkin'

export async function POST(req: NextRequest) {
  const { qrToken, classSessionId } = await req.json()
  if (!qrToken) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const student = await prisma.user.findUnique({
    where: { qrToken },
    select: { id: true, name: true },
  })
  if (!student) return NextResponse.json({ error: 'Unknown QR code' }, { status: 404 })

  let resolvedSessionId = classSessionId as string | undefined

  if (!resolvedSessionId) {
    const commitments = await prisma.commitment.findMany({
      where: { userId: student.id },
      include: { classSession: true },
    })
    const match = commitments.find(c => isInCheckinWindow(c.classSession.date))
    if (!match) {
      return NextResponse.json({ error: 'No registered class found for today.' }, { status: 400 })
    }
    resolvedSessionId = match.classSessionId
  }

  const classSession = await prisma.classSession.findUnique({
    where: { id: resolvedSessionId },
    include: { class: { select: { title: true } } },
  })
  if (!classSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  if (!isInCheckinWindow(classSession.date)) {
    return NextResponse.json({ error: 'Check-in is only available on the day of class.' }, { status: 400 })
  }

  await recordCheckin(student.id, resolvedSessionId, 'qr_code')

  return NextResponse.json({ ok: true, student: student.name, class: classSession.class.title })
}
