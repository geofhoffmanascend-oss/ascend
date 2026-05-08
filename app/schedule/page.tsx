import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { generateSessionsForRange, getMondayOfWeek } from '@/lib/generateSessions'
import { WeeklySchedule } from './WeeklySchedule'
import { MonthCalendar } from './MonthCalendar'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string; month?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  await generateSessionsForRange(6)

  const params = await searchParams
  const viewMode = params.view === 'month' ? 'month' : 'week'

  // ── Month view ──────────────────────────────────────────────────────────────
  if (viewMode === 'month') {
    const today = new Date()
    const currentMonth = params.month
      ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const [year, monthNum] = currentMonth.split('-').map(Number)
    const firstDay = new Date(Date.UTC(year, monthNum - 1, 1))
    const lastDay = new Date(Date.UTC(year, monthNum, 0))
    lastDay.setUTCHours(23, 59, 59, 999)

    const rawSessions = await prisma.classSession.findMany({
      where: { date: { gte: firstDay, lte: lastDay }, class: { isActive: true } },
      include: {
        class: { select: { title: true, type: true, startTime: true } },
        commitments: { where: { userId: session.user.id }, select: { id: true } },
        attendance: { where: { userId: session.user.id }, select: { checkedInAt: true } },
      },
      orderBy: [{ date: 'asc' }, { class: { startTime: 'asc' } }],
    })

    const monthSessions = rawSessions.map(s => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      cancelled: s.cancelled,
      myCommitment: s.commitments.length > 0,
      myCheckedIn: s.attendance.length > 0 && s.attendance[0].checkedInAt !== null,
      class: { title: s.class.title, startTime: s.class.startTime, type: s.class.type },
    }))

    const weekToggle = getMondayOfWeek(today).toISOString().split('T')[0]

    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-block bg-brand-red px-3 py-1 mb-3">
              <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
                Schedule
              </span>
            </div>
            <h1 className="font-display text-2xl text-ink">Class Schedule</h1>
          </div>
          <ViewToggle active="month" weekStr={weekToggle} monthStr={currentMonth} />
        </div>
        <MonthCalendar sessions={monthSessions} currentMonth={currentMonth} />
      </div>
    )
  }

  // ── Week view ────────────────────────────────────────────────────────────────
  const monday = params.week
    ? (() => { const d = new Date(params.week!); d.setUTCHours(0, 0, 0, 0); return d })()
    : getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: monday, lte: sunday }, class: { isActive: true } },
    include: {
      class: {
        select: {
          id: true, title: true, type: true,
          startTime: true, endTime: true, location: true,
          instructor: { select: { name: true } },
        },
      },
      commitments: {
        select: {
          id: true, userId: true,
          user: { select: { name: true, belt: true } },
        },
      },
      attendance: {
        where: { userId: session.user.id },
        select: { checkedInAt: true },
      },
    },
    orderBy: [{ date: 'asc' }, { class: { startTime: 'asc' } }],
  })

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const daySessions = sessions
      .filter(s => s.date.toISOString().split('T')[0] === dateStr)
      .map(s => {
        const myCommitment = s.commitments.find(c => c.userId === session.user.id)
        return {
          id: s.id,
          date: dateStr,
          cancelled: s.cancelled,
          cancelNote: s.cancelNote,
          notes: s.notes,
          committedCount: s.commitments.length,
          myCommitment: myCommitment ? { id: myCommitment.id } : null,
          myCheckedIn: s.attendance.length > 0 && s.attendance[0].checkedInAt !== null,
          otherCommitted: s.commitments
            .filter(c => c.userId !== session.user.id)
            .map(c => ({ name: c.user.name ?? 'Unknown', belt: c.user.belt as string })),
          class: {
            id: s.class.id,
            title: s.class.title,
            type: s.class.type as string,
            startTime: s.class.startTime,
            endTime: s.class.endTime,
            location: s.class.location,
            instructorName: s.class.instructor.name ?? 'Instructor',
          },
        }
      })

    return { date: dateStr, sessions: daySessions }
  })

  const mondayStr = monday.toISOString().split('T')[0]
  const monthToggle = `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Schedule
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Class Schedule</h1>
        </div>
        <ViewToggle active="week" weekStr={mondayStr} monthStr={monthToggle} />
      </div>
      <WeeklySchedule days={days} currentMonday={mondayStr} />
    </div>
  )
}

function ViewToggle({
  active,
  weekStr,
  monthStr,
}: {
  active: 'week' | 'month'
  weekStr: string
  monthStr: string
}) {
  return (
    <div className="flex gap-1 mb-1">
      <Link
        href={`/schedule?view=week&week=${weekStr}`}
        className={`px-3 py-1.5 text-sm font-bold transition-colors ${
          active === 'week'
            ? 'bg-brand-red text-paper'
            : 'border border-smoke text-steel hover:border-steel hover:text-ink'
        }`}
      >
        Week
      </Link>
      <Link
        href={`/schedule?view=month&month=${monthStr}`}
        className={`px-3 py-1.5 text-sm font-bold transition-colors ${
          active === 'month'
            ? 'bg-brand-red text-paper'
            : 'border border-smoke text-steel hover:border-steel hover:text-ink'
        }`}
      >
        Month
      </Link>
    </div>
  )
}
