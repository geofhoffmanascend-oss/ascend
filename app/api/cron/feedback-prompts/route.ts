import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { sessionStartTime } from '@/lib/checkin'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Window: sessions that started 55–65 minutes ago
  const windowStart = new Date(now.getTime() - 65 * 60000)
  const windowEnd   = new Date(now.getTime() - 55 * 60000)

  const sessions = await prisma.classSession.findMany({
    where: { cancelled: false },
    include: {
      class: { select: { startTime: true, title: true } },
      attendance: {
        where: { checkedInAt: { not: null } },
        select: { userId: true, classSessionId: true },
      },
    },
  })

  let sent = 0
  for (const s of sessions) {
    const start = sessionStartTime(s.date, s.class.startTime)
    if (start < windowStart || start > windowEnd) continue

    for (const a of s.attendance) {
      const notif = await createNotification(
        a.userId,
        'feedback_prompt',
        `How was ${s.class.title}?`,
        {
          body: 'Log your training or share feedback with your instructor.',
          link: `/feedback/${s.id}`,
        },
      )
      if (notif) sent++
    }
  }

  return NextResponse.json({ sent })
}
