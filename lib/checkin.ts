import { CheckInSource } from '@prisma/client'
import prisma from '@/lib/database'

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
  return prisma.attendance.upsert({
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
}
