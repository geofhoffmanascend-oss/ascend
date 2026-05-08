import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export default async function InstructorHomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'instructor' && session.user.role !== 'admin') redirect('/dashboard')

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setUTCHours(23, 59, 59, 999)

  const sessions = await prisma.classSession.findMany({
    where: {
      date: { gte: today, lte: todayEnd },
      class: {
        isActive: true,
        ...(session.user.role !== 'admin' && { instructorId: session.user.id }),
      },
    },
    include: {
      class: { select: { id: true, title: true, startTime: true, endTime: true, type: true, location: true } },
      _count: { select: { commitments: true } },
    },
    orderBy: { class: { startTime: 'asc' } },
  })

  const todayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  const TYPE_LABELS: Record<string, string> = {
    gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
    competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Instructor
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">Today — {todayLabel}</h1>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-smoke bg-paper p-6 mb-8">
          <p className="text-ash text-sm">No classes scheduled for today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {sessions.map(s => (
            <Link
              key={s.id}
              href={`/instructor/sessions/${s.id}`}
              className={`border bg-paper p-5 flex items-center justify-between hover:border-steel transition-colors ${s.cancelled ? 'opacity-60 border-smoke' : 'border-l-2 border-l-brand-red border-t-smoke border-r-smoke border-b-smoke'}`}
            >
              <div>
                <p className="font-medium text-ink">{s.class.title}</p>
                <p className="text-sm text-ash mt-0.5">
                  {s.class.startTime}–{s.class.endTime}
                  {s.class.location && ` · ${s.class.location}`}
                  {' · '}{TYPE_LABELS[s.class.type] ?? s.class.type}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xl font-display font-bold text-ink">{s._count.commitments}</p>
                <p className="text-xs text-ash">committed</p>
                {s.cancelled && (
                  <span className="mt-1 inline-block px-2 py-0.5 bg-brand-red text-paper text-xs font-bold uppercase">
                    Cancelled
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/instructor/classes" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">My Classes</p>
          <p className="text-slate text-sm">Rosters and class settings</p>
        </Link>
        <Link href="/instructor/plans" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Lesson Plans</p>
          <p className="text-slate text-sm">Create and manage lesson plans</p>
        </Link>
        <Link href="/dashboard" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Dashboard</p>
          <p className="text-slate text-sm">Back to student view</p>
        </Link>
      </div>
    </div>
  )
}
