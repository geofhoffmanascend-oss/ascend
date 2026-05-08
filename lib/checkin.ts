import { CheckInSource } from '@prisma/client'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { sendPush } from '@/lib/push'

export function sessionStartTime(date: Date, startTime: string): Date {
  const [h, m] = startTime.split(':').map(Number)
  const d = new Date(date)
  d.setUTCHours(h, m, 0, 0)
  return d
}

export function isInCheckinWindow(sessionDate: Date, now = new Date()): boolean {
  return (
    sessionDate.getUTCFullYear() === now.getFullYear() &&
    sessionDate.getUTCMonth() === now.getMonth() &&
    sessionDate.getUTCDate() === now.getDate()
  )
}

export async function recordCheckin(
  userId: string,
  classSessionId: string,
  source: CheckInSource,
) {
  const attendance = await prisma.attendance.upsert({
    where: { userId_classSessionId: { userId, classSessionId } },
    create: {
      userId,
      classSessionId,
      attended: true,
      markedById: userId,
      checkedInAt: new Date(),
      checkInSource: source,
    },
    update: {
      attended: true,
      checkedInAt: new Date(),
      checkInSource: source,
    },
  })

  // Feedback/journal prompt after check-in (fire and forget)
  prisma.classSession.findUnique({
    where: { id: classSessionId },
    select: { class: { select: { title: true } } },
  }).then(async s => {
    if (!s) return
    const notif = await createNotification(userId, 'feedback_prompt', `How was ${s.class.title}?`, {
      body: 'Log your training or share feedback with your instructor.',
      link: `/feedback/${classSessionId}`,
    })
    if (notif) sendPush(userId, {
      title: `How was ${s.class.title}?`,
      body: 'Log your training or share feedback with your instructor.',
      link: `/feedback/${classSessionId}`,
    }).catch(() => {})
  }).catch(() => {})

  return attendance
}
