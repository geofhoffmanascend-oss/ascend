import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { generateSessionsForRange, getMondayOfWeek } from '@/lib/generateSessions'
import { ScheduleShell } from './ScheduleShell'
import { classTypeToGroup } from '@/lib/classGroups'
import { ClassGroup } from '@prisma/client'

export const metadata = { title: 'Schedule' }

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string; month?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  await generateSessionsForRange(6)

  // The schedule shows only the member's own gym's classes (multi-tenancy).
  const gymId = session.user.gymId ?? null

  const params = await searchParams
  const viewMode = params.view === 'month' ? 'month' : 'week'
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const userAccess = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { blockedClassGroups: true, hiddenClassGroups: true, blockedProgramIds: true, hiddenProgramIds: true },
  })
  const blocked = (userAccess?.blockedClassGroups ?? []) as ClassGroup[]
  const hidden  = (userAccess?.hiddenClassGroups  ?? []) as ClassGroup[]
  const blockedPrograms = (userAccess?.blockedProgramIds ?? []) as string[]
  const hiddenPrograms  = (userAccess?.hiddenProgramIds  ?? []) as string[]

  function isHidden(classType: string, programId?: string | null) {
    const g = classTypeToGroup(classType)
    if (g !== null && hidden.includes(g)) return true
    if (programId && hiddenPrograms.includes(programId)) return true
    return false
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

  // ── Month view ──────────────────────────────────────────────────────────────
  if (viewMode === 'month') {
    const currentMonth = params.month
      ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const [year, monthNum] = currentMonth.split('-').map(Number)
    const prevMonthDate = new Date(Date.UTC(year, monthNum - 2, 1))
    const nextMonthDate = new Date(Date.UTC(year, monthNum, 1))
    const prevMonthStr = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0')}`
    const nextMonthStr = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}`
    const monthPeriodLabel = `${MONTH_NAMES[monthNum - 1]} ${year}`

    const firstDay = new Date(Date.UTC(year, monthNum - 1, 1))
    const lastDay = new Date(Date.UTC(year, monthNum, 0))
    lastDay.setUTCHours(23, 59, 59, 999)

    const rawSessions = await prisma.classSession.findMany({
      where: { date: { gte: firstDay, lte: lastDay }, class: { isActive: true, gymId } },
      include: {
        class: { select: { title: true, type: true, programId: true, startTime: true } },
        commitments: { where: { userId: session.user.id }, select: { id: true } },
        attendance: { where: { userId: session.user.id }, select: { checkedInAt: true } },
      },
      orderBy: [{ date: 'asc' }, { class: { startTime: 'asc' } }],
    })

    const monthSessions = rawSessions
      .filter(s => !isHidden(s.class.type, s.class.programId))
      .map(s => ({
        id: s.id,
        date: s.date.toISOString().split('T')[0],
        cancelled: s.cancelled,
        myCommitment: s.commitments.length > 0,
        myCheckedIn: s.attendance.length > 0 && s.attendance[0].checkedInAt !== null,
        class: { title: s.class.title, startTime: s.class.startTime, type: s.class.type, programId: s.class.programId },
      }))

    const weekStr = getMondayOfWeek(today).toISOString().split('T')[0]

    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Schedule</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Class Schedule</h1>
        </div>
        <ScheduleShell
          userId={session.user.id}
          view="month"
          todayStr={todayStr}
          weekStr={weekStr}
          monthStr={currentMonth}
          prevUrl={`/schedule?view=month&month=${prevMonthStr}`}
          nextUrl={`/schedule?view=month&month=${nextMonthStr}`}
          periodLabel={monthPeriodLabel}
          blockedClassGroups={blocked}
          blockedProgramIds={blockedPrograms}
          monthSessions={monthSessions}
          currentMonth={currentMonth}
        />
      </div>
    )
  }

  // ── Week view ────────────────────────────────────────────────────────────────
  const monday = params.week
    ? (() => { const d = new Date(params.week!); d.setUTCHours(0, 0, 0, 0); return d })()
    : getMondayOfWeek(today)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: monday, lte: sunday }, class: { isActive: true, gymId } },
    include: {
      class: {
        select: {
          id: true, title: true, type: true, programId: true,
          startTime: true, endTime: true, location: true,
          instructor: { select: { name: true } },
        },
      },
      commitments: {
        select: {
          id: true, userId: true,
          user: { select: { id: true, name: true, belt: true } },
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
      .filter(s => s.date.toISOString().split('T')[0] === dateStr && !isHidden(s.class.type, s.class.programId))
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
            .map(c => ({ id: c.user.id, name: c.user.name ?? 'Unknown', belt: c.user.belt as string })),
          class: {
            id: s.class.id,
            title: s.class.title,
            type: s.class.type as string,
            programId: s.class.programId,
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
  const monthStr = `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}`

  const prevMonday = new Date(monday); prevMonday.setUTCDate(monday.getUTCDate() - 7)
  const nextMonday = new Date(monday); nextMonday.setUTCDate(monday.getUTCDate() + 7)
  const prevWeekStr = prevMonday.toISOString().split('T')[0]
  const nextWeekStr = nextMonday.toISOString().split('T')[0]

  const weekSunday = new Date(monday); weekSunday.setUTCDate(monday.getUTCDate() + 6)
  const sameMonth = monday.getUTCMonth() === weekSunday.getUTCMonth()
  const weekPeriodLabel = sameMonth
    ? `${MONTH_NAMES[monday.getUTCMonth()].slice(0, 3)} ${monday.getUTCDate()}–${weekSunday.getUTCDate()}`
    : `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${weekSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Schedule</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Class Schedule</h1>
      </div>
      <ScheduleShell
        userId={session.user.id}
        view="week"
        todayStr={todayStr}
        weekStr={mondayStr}
        monthStr={monthStr}
        prevUrl={`/schedule?view=week&week=${prevWeekStr}`}
        nextUrl={`/schedule?view=week&week=${nextWeekStr}`}
        periodLabel={weekPeriodLabel}
        blockedClassGroups={blocked}
        blockedProgramIds={blockedPrograms}
        days={days}
        currentMonday={mondayStr}
      />
    </div>
  )
}
