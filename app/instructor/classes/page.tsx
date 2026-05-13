import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getMondayOfWeek } from '@/lib/generateSessions'

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

export default async function InstructorClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const classes = await prisma.class.findMany({
    where: !session.user.roles?.includes('admin') ? { instructorId: session.user.id } : {},
    include: {
      _count: { select: { sessions: true } },
      sessions: {
        where: { date: { gte: monday, lte: sunday } },
        include: { _count: { select: { commitments: true } } },
        take: 1,
        orderBy: { date: 'asc' },
      },
    },
    orderBy: [{ isActive: 'desc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">My Classes</h1>
      </div>

      {classes.length === 0 && (
        <p className="text-ash text-sm italic">No classes assigned.</p>
      )}

      <div className="flex flex-col gap-3">
        {classes.map(cls => {
          const nextSession = cls.sessions[0]
          return (
            <Link
              key={cls.id}
              href={`/instructor/classes/${cls.id}`}
              className={`border bg-paper p-5 flex items-center justify-between hover:border-steel transition-colors ${cls.isActive ? 'border-smoke' : 'border-smoke opacity-60'}`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-ink">{cls.title}</p>
                  {!cls.isActive && (
                    <span className="px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide bg-mist text-ash">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-ash">
                  {DAY_LABELS[cls.dayOfWeek]} · {cls.startTime}–{cls.endTime}
                  {cls.location && ` · ${cls.location}`}
                </p>
                <p className="text-xs text-ash mt-0.5">{TYPE_LABELS[cls.type] ?? cls.type}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {nextSession ? (
                  <>
                    <p className="text-lg font-display font-bold text-ink">{nextSession._count.commitments}</p>
                    <p className="text-xs text-ash">this week</p>
                  </>
                ) : (
                  <p className="text-xs text-ash">—</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
