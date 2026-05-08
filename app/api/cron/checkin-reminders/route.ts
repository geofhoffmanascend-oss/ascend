import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { sendPush } from '@/lib/push'
import { sessionStartTime } from '@/lib/checkin'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  const valid =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET
  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  // Window: sessions starting 10–20 minutes from now
  const windowStart = new Date(now.getTime() + 10 * 60000)
  const windowEnd   = new Date(now.getTime() + 20 * 60000)

  const sessions = await prisma.classSession.findMany({
    where: { cancelled: false },
    include: {
      class: { select: { startTime: true, title: true } },
      commitments: { select: { userId: true } },
    },
  })

  let sent = 0
  for (const s of sessions) {
    const start = sessionStartTime(s.date, s.class.startTime)
    if (start < windowStart || start > windowEnd) continue

    for (const c of s.commitments) {
      const notif = await createNotification(
        c.userId,
        'checkin_prompt',
        `Time to check in for ${s.class.title}`,
        { body: 'Class starts in ~15 minutes. Tap to check in.', link: `/schedule` },
      )
      if (notif) {
        sent++
        sendPush(c.userId, {
          title: `Time to check in for ${s.class.title}`,
          body: 'Class starts in ~15 minutes. Tap to check in.',
          link: '/schedule',
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ sent })
}
