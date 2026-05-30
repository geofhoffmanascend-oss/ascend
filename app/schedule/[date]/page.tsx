import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { getMondayOfWeek } from '@/lib/generateSessions'
import { ViewToggle, PeriodNav } from '../ScheduleShell'
import { DayViewActions } from './DayViewActions'
import { classTypeToGroup } from '@/lib/classGroups'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Basics (Gi)',
  nogi_fundamentals: 'Basics (No-Gi)', muay_thai: 'Muay Thai',
  wrestling: 'Wrestling', self_defense: 'Self Defense',
}

export default async function DayViewPage({ params }: { params: Promise<{ date: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { date } = await params
  const day = new Date(date)
  day.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setUTCHours(23, 59, 59, 999)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { blockedClassGroups: true, hiddenClassGroups: true },
  })

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: day, lte: dayEnd }, class: { isActive: true } },
    include: {
      class: {
        select: {
          title: true, type: true, startTime: true, endTime: true,
          location: true, instructor: { select: { name: true } },
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
        select: { attended: true },
      },
    },
    orderBy: { class: { startTime: 'asc' } },
  })

  const blocked = (user?.blockedClassGroups ?? []) as string[]
  const hidden = (user?.hiddenClassGroups ?? []) as string[]

  const visibleSessions = sessions.filter(s => {
    const group = classTypeToGroup(s.class.type as any)
    return group === null || !hidden.includes(group)
  })

  const formatted = day.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const weekStr = getMondayOfWeek(day).toISOString().split('T')[0]
  const monthStr = date.slice(0, 7)

  const prevDay = new Date(day); prevDay.setUTCDate(day.getUTCDate() - 1)
  const nextDay = new Date(day); nextDay.setUTCDate(day.getUTCDate() + 1)
  const prevDayStr = prevDay.toISOString().split('T')[0]
  const nextDayStr = nextDay.toISOString().split('T')[0]
  const dayLabel = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Schedule</span>
        </div>
        <h1 className="font-display text-2xl text-ink mb-4">{formatted}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <ViewToggle active="day" todayStr={todayStr} weekStr={weekStr} monthStr={monthStr} />
          <PeriodNav prevUrl={`/schedule/${prevDayStr}`} nextUrl={`/schedule/${nextDayStr}`} label={dayLabel} />
        </div>
      </div>

      {visibleSessions.length === 0 && (
        <p className="text-ash text-sm italic">No classes scheduled for this day.</p>
      )}

      <div className="flex flex-col gap-6">
        {visibleSessions.map(s => {
          const myCommitment = s.commitments.find(c => c.userId === session.user.id)
          const myCheckedIn = s.attendance?.[0]?.attended ?? false
          const group = classTypeToGroup(s.class.type as any)
          const isBlocked = group !== null && blocked.includes(group)
          return (
            <div
              key={s.id}
              className={`border bg-paper p-6 ${isBlocked ? 'opacity-50 border-smoke' : myCommitment ? 'border-l-2 border-l-brand-red border-t-smoke border-r-smoke border-b-smoke' : 'border-smoke'} ${s.cancelled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display text-lg text-ink">{s.class.title}</h2>
                  <p className="text-ash text-sm mt-0.5">
                    {s.class.startTime}–{s.class.endTime}
                    {s.class.location && ` · ${s.class.location}`}
                  </p>
                  <p className="text-ash text-sm">{s.class.instructor.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 bg-mist text-steel text-xs font-bold uppercase tracking-wide">
                    {TYPE_LABELS[s.class.type] ?? s.class.type}
                  </span>
                  {s.cancelled && (
                    <span className="px-2 py-0.5 bg-brand-red text-paper text-xs font-bold uppercase tracking-wide">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {s.cancelNote && (
                <p className="text-sm text-slate mb-4 italic">{s.cancelNote}</p>
              )}
              {s.notes && (
                <p className="text-sm text-slate mb-4">{s.notes}</p>
              )}
              {(s as any).notesPublic && (s as any).sessionNotes && myCommitment && (
                <div className="mb-4 border-l-2 border-l-brand-red pl-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Instructor Notes</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{(s as any).sessionNotes}</p>
                </div>
              )}

              {isBlocked && (
                <p className="text-xs text-ash italic mb-4">Not included in your membership</p>
              )}

              <DayViewActions
                sessionId={s.id}
                sessionDate={s.date.toISOString()}
                startTime={s.class.startTime}
                commitmentId={myCommitment?.id ?? null}
                checkedIn={myCheckedIn}
                isBlocked={isBlocked}
                isCancelled={s.cancelled ?? false}
              />

              <div className="border-t border-smoke pt-4 mt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">
                  {s.commitments.length} Registered
                </p>
                {s.commitments.length === 0 ? (
                  <p className="text-ash text-xs italic">No one registered yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {s.commitments.map(c => (
                      <Link key={c.id} href={`/profile/${c.user.id}`} className="flex items-center gap-2 hover:text-brand-red transition-colors">
                        <div className="w-7 h-7 rounded-full bg-mist border border-smoke flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-steel">
                            {(c.user.name ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-ink font-medium">{c.user.name}</p>
                          <BeltBadge belt={c.user.belt as Belt} stripes={0} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
