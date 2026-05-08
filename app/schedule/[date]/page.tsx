import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
}

export default async function DayViewPage({ params }: { params: Promise<{ date: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { date } = await params
  const day = new Date(date)
  day.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setUTCHours(23, 59, 59, 999)

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
          user: { select: { name: true, belt: true } },
        },
      },
    },
    orderBy: { class: { startTime: 'asc' } },
  })

  const formatted = day.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/schedule" className="text-xs text-ash hover:text-ink transition-colors">
          ← Schedule
        </Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Day View
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">{formatted}</h1>
      </div>

      {sessions.length === 0 && (
        <p className="text-ash text-sm italic">No classes scheduled for this day.</p>
      )}

      <div className="flex flex-col gap-6">
        {sessions.map(s => {
          const myCommitment = s.commitments.find(c => c.userId === session.user.id)
          return (
            <div
              key={s.id}
              className={`border bg-paper p-6 ${myCommitment ? 'border-l-2 border-l-brand-red border-t-smoke border-r-smoke border-b-smoke' : 'border-smoke'} ${s.cancelled ? 'opacity-60' : ''}`}
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

              <div className="border-t border-smoke pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">
                  {s.commitments.length} Registered
                </p>
                {s.commitments.length === 0 ? (
                  <p className="text-ash text-xs italic">No one registered yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {s.commitments.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-mist border border-smoke flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-steel">
                            {(c.user.name ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-ink font-medium">{c.user.name}</p>
                          <BeltBadge belt={c.user.belt as Belt} stripes={0} />
                        </div>
                      </div>
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
