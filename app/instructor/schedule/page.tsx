import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
  nogi_fundamentals: 'No-Gi Fund.', muay_thai: 'Muay Thai', wrestling: 'Wrestling',
  self_defense: 'Self Defense',
}

export default async function InstructorSchedulePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const fourWeeksOut = new Date(today)
  fourWeeksOut.setDate(fourWeeksOut.getDate() + 28)

  const sessions = await prisma.classSession.findMany({
    where: {
      date: { gte: today, lte: fourWeeksOut },
      class: {
        isActive: true,
        ...(!session.user.roles?.includes('admin') && { instructorId: session.user.id }),
      },
    },
    include: {
      class: { select: { id: true, title: true, startTime: true, endTime: true, type: true, location: true } },
      _count: { select: { commitments: true, attendance: true } },
      subRequests: { where: { status: 'open' }, select: { id: true } },
    },
    orderBy: [{ date: 'asc' }, { class: { startTime: 'asc' } }],
  })

  // Group by week
  type SessionRow = typeof sessions[number]
  const weeks: { label: string; sessions: SessionRow[] }[] = []
  for (const s of sessions) {
    const weekStart = new Date(s.date)
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
    const label = weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
    const existing = weeks.find(w => w.label === label)
    if (existing) existing.sessions.push(s)
    else weeks.push({ label, sessions: [s] })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Upcoming Schedule</h1>
        <p className="text-ash text-sm mt-1">Next 4 weeks</p>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-smoke bg-paper p-8 text-center">
          <p className="text-ash text-sm">No upcoming sessions scheduled.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeks.map(week => (
            <div key={week.label}>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">
                Week of {week.label}
              </p>
              <div className="flex flex-col gap-2">
                {week.sessions.map(s => {
                  const dateLabel = s.date.toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
                  })
                  const checkedIn = s._count.attendance
                  const registered = s._count.commitments
                  const hasOpenSub = s.subRequests.length > 0

                  return (
                    <Link
                      key={s.id}
                      href={`/instructor/sessions/${s.id}`}
                      className={`border bg-paper p-4 flex items-center justify-between hover:border-steel transition-colors ${
                        s.cancelled ? 'opacity-50 border-smoke' : 'border-smoke'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-ink text-sm">{s.class.title}</p>
                          {s.cancelled && (
                            <span className="text-xs px-1.5 py-0.5 bg-brand-red text-paper font-bold uppercase">Cancelled</span>
                          )}
                          {hasOpenSub && (
                            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 font-bold uppercase">Sub Needed</span>
                          )}
                        </div>
                        <p className="text-xs text-ash mt-0.5">
                          {dateLabel} · {s.class.startTime}–{s.class.endTime}
                          {s.class.location && ` · ${s.class.location}`}
                          {' · '}{TYPE_LABELS[s.class.type] ?? s.class.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4 text-right">
                        <div>
                          <p className="text-lg font-display font-bold text-ink">{registered}</p>
                          <p className="text-xs text-ash">registered</p>
                        </div>
                        <div>
                          <p className="text-lg font-display font-bold text-ink">{checkedIn}</p>
                          <p className="text-xs text-ash">checked in</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
