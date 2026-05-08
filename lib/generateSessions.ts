import prisma from '@/lib/database'

const DAY_TO_UTC: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

export async function generateSessionsForRange(weeksAhead = 5) {
  const classes = await prisma.class.findMany({
    where: { isActive: true },
    select: { id: true, dayOfWeek: true },
  })
  if (!classes.length) return

  const monday = getMondayOfWeek(new Date())
  const data: { classId: string; date: Date }[] = []

  for (let week = 0; week < weeksAhead; week++) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(monday)
      d.setUTCDate(monday.getUTCDate() + week * 7 + day)
      const utcDay = d.getUTCDay()
      for (const cls of classes) {
        if (DAY_TO_UTC[cls.dayOfWeek] === utcDay) {
          data.push({ classId: cls.id, date: d })
        }
      }
    }
  }

  if (data.length) {
    await prisma.classSession.createMany({ data, skipDuplicates: true })
  }
}
