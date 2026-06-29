import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { weekKey, jsDayToDayOfWeek, todayDateOnly } from '@/lib/personalTraining'
import { getMondayOfWeek } from '@/lib/generateSessions'
import { MyTrainingClient } from './MyTrainingClient'

export const metadata = { title: 'My Training' }

export default async function MyTrainingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [personalClasses, checkIns] = await Promise.all([
    prisma.personalClass.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.selfCheckIn.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 60,
      include: { personalClass: { select: { label: true } } },
    }),
  ])

  const today = todayDateOnly()
  const todayKey = today.toISOString().split('T')[0]
  const todayDow = jsDayToDayOfWeek(new Date().getDay())

  // Which of today's check-ins map to which slot (or ad-hoc = null).
  const checkedInTodayClassIds = new Set(
    checkIns
      .filter((c) => c.date.toISOString().split('T')[0] === todayKey && c.personalClassId)
      .map((c) => c.personalClassId as string),
  )
  const adHocToday = checkIns.some(
    (c) => c.date.toISOString().split('T')[0] === todayKey && !c.personalClassId,
  )

  // Self-tracked streak: consecutive Mon–Sun weeks with at least one self check-in.
  const weeks = new Set(checkIns.map((c) => weekKey(c.date)))
  let streak = 0
  const cursor = getMondayOfWeek(new Date())
  for (let i = 0; i < 52; i++) {
    if (weeks.has(cursor.toISOString().split('T')[0])) {
      streak++
      cursor.setUTCDate(cursor.getUTCDate() - 7)
    } else break
  }

  const last30 = checkIns.filter((c) => {
    const d = new Date(c.date)
    const cutoff = new Date(today)
    cutoff.setUTCDate(cutoff.getUTCDate() - 30)
    return d >= cutoff
  }).length

  return (
    <MyTrainingClient
      personalClasses={personalClasses.map((p) => ({
        id: p.id, label: p.label, type: p.type, dayOfWeek: p.dayOfWeek,
        startTime: p.startTime, endTime: p.endTime, location: p.location,
      }))}
      checkIns={checkIns.map((c) => ({
        id: c.id,
        date: c.date.toISOString().split('T')[0],
        label: c.label ?? c.personalClass?.label ?? null,
        note: c.note,
      }))}
      todayDow={todayDow}
      checkedInTodayClassIds={[...checkedInTodayClassIds]}
      adHocToday={adHocToday}
      streak={streak}
      last30={last30}
    />
  )
}
