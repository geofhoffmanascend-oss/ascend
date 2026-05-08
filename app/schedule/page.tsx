import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { generateSessionsForRange, getMondayOfWeek } from '@/lib/generateSessions'
import { WeeklySchedule } from './WeeklySchedule'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  await generateSessionsForRange(6)

  const { week } = await searchParams
  const monday = week ? (() => { const d = new Date(week); d.setUTCHours(0,0,0,0); return d })() : getMondayOfWeek(new Date())
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Schedule
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">Class Schedule</h1>
      </div>
      <WeeklySchedule days={days} currentMonday={monday.toISOString().split('T')[0]} />
    </div>
  )
}
