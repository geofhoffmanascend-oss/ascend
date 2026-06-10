import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { getMondayOfWeek } from '@/lib/generateSessions'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
}

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const { id } = await params

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      instructor: { select: { name: true } },
    },
  })

  if (!cls) notFound()
  // Own class, or an admin of the same gym (multi-tenancy).
  const allowedClass = cls.instructorId === session.user.id ||
    (!!session.user.roles?.includes('admin') && cls.gymId === session.user.gymId)
  if (!allowedClass) redirect('/instructor/classes')

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const nextSession = await prisma.classSession.findFirst({
    where: { classId: id, date: { gte: monday, lte: sunday } },
    include: {
      commitments: {
        include: { user: { select: { id: true, name: true, belt: true, stripes: true } } },
        orderBy: { user: { belt: 'asc' } },
      },
    },
  })

  // Group committed students by weight class
  type Commitment = NonNullable<typeof nextSession>['commitments'][number]
  const byWeightClass: Record<string, Commitment[]> = {}
  if (nextSession) {
    for (const c of nextSession.commitments) {
      const wc = c.weightClass ?? 'Unspecified'
      if (!byWeightClass[wc]) byWeightClass[wc] = []
      byWeightClass[wc].push(c)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor/classes" className="text-xs text-ash hover:text-ink transition-colors">← Classes</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Class</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{cls.title}</h1>
        <p className="text-ash text-sm mt-1">
          {TYPE_LABELS[cls.type] ?? cls.type} · {cls.dayOfWeek} · {cls.startTime}–{cls.endTime}
          {cls.location && ` · ${cls.location}`}
        </p>
      </div>

      {/* This week's session */}
      <div className="border border-smoke bg-paper p-6 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">This Week's Roster</p>

        {!nextSession ? (
          <p className="text-ash text-sm italic">No session this week.</p>
        ) : nextSession.commitments.length === 0 ? (
          <p className="text-ash text-sm italic">No one registered yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(byWeightClass).map(([wc, commitments]) => (
              <div key={wc}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-steel">{wc}</p>
                  {commitments.length === 1 && (
                    <span className="px-1.5 py-0.5 bg-brand-red text-paper text-xs font-bold uppercase tracking-wide">
                      No partner
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {commitments.map(c => (
                    <Link
                      key={c.id}
                      href={`/instructor/students/${c.user.id}`}
                      className="flex items-center gap-3 hover:text-brand-red transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-mist border border-smoke flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-steel">{(c.user.name ?? '?')[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm text-ink">{c.user.name}</p>
                        <BeltBadge belt={c.user.belt as Belt} stripes={c.user.stripes} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {nextSession && (
          <div className="mt-4 pt-4 border-t border-smoke">
            <Link
              href={`/instructor/sessions/${nextSession.id}`}
              className="text-sm font-medium text-brand-red hover:text-brand-red-dark transition-colors"
            >
              View full session → mark attendance, add notes
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
