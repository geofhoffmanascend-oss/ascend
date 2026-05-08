import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getMondayOfWeek } from '@/lib/generateSessions'
import { DeleteAccountButton } from '@/app/components/DeleteAccountButton'
import { CheckinButton } from '@/app/components/CheckinButton'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0)

  const [commitments, attendanceRecords, recentLogs, recentPosts] = await Promise.all([
  prisma.commitment.findMany({
    where: {
      userId: session.user.id,
      classSession: { date: { gte: monday, lte: sunday } },
    },
    include: {
      classSession: {
        select: {
          id: true, date: true, cancelled: true,
          class: { select: { title: true, startTime: true, type: true } },
        },
      },
    },
    orderBy: [{ classSession: { date: 'asc' } }, { classSession: { class: { startTime: 'asc' } } }],
  }),
  prisma.attendance.findMany({
    where: {
      userId: session.user.id,
      attended: true,
      classSession: { date: { gte: thirtyDaysAgo } },
    },
    select: {
      id: true, classSessionId: true,
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
    orderBy: { classSession: { date: 'desc' } },
  }),
  prisma.trainingLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true, isGuided: true, isPrivate: true, createdAt: true,
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
  }),
  prisma.post.findMany({
    where: {
      parentId: null,
      forum: {
        OR: [
          { type: { in: ['general', 'announcement'] } },
          { subscriptions: { some: { userId: session.user.id } } },
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true, content: true, type: true, createdAt: true,
      author: { select: { name: true } },
      forum: { select: { id: true, title: true } },
    },
  }),
])

  const todayStr = new Date().toISOString().split('T')[0]
  const checkedInIds = new Set(attendanceRecords.map(r => r.classSessionId))

  // Compute streak: consecutive calendar weeks (Mon–Sun) with at least one attended class
  const attendedWeeks = new Set(
    attendanceRecords.map(r => {
      const d = new Date(r.classSession.date)
      const day = d.getUTCDay()
      const diff = (day === 0 ? -6 : 1 - day)
      d.setUTCDate(d.getUTCDate() + diff)
      return d.toISOString().split('T')[0]
    })
  )
  let streak = 0
  const checkWeek = getMondayOfWeek(new Date())
  for (let i = 0; i < 52; i++) {
    const key = checkWeek.toISOString().split('T')[0]
    if (attendedWeeks.has(key)) {
      streak++
      checkWeek.setUTCDate(checkWeek.getUTCDate() - 7)
    } else {
      break
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Dashboard
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">
          Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
      </div>

      {/* This week's committed classes */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">This Week</p>
        {commitments.length === 0 ? (
          <div className="border border-smoke bg-paper p-5">
            <p className="text-ash text-sm">No classes registered this week. <Link href="/schedule" className="text-brand-red hover:text-brand-red-dark font-medium">View schedule →</Link></p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {commitments.map(c => {
              const s = c.classSession
              const dateObj = new Date(s.date)
              const sessionDateStr = s.date.toISOString().split('T')[0]
              const dayLabel = DAY_ABBR[dateObj.getUTCDay()]
              const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
              const isToday = sessionDateStr === todayStr
              const alreadyCheckedIn = checkedInIds.has(s.id)
              return (
                <div
                  key={c.id}
                  className={`border bg-paper p-4 flex items-center justify-between transition-colors ${s.cancelled ? 'opacity-60 border-smoke' : 'border-l-2 border-l-brand-red border-t-smoke border-r-smoke border-b-smoke'}`}
                >
                  <Link href={`/schedule/${sessionDateStr}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{s.class.title}</p>
                    <p className="text-xs text-ash mt-0.5">{dayLabel} {dateLabel} · {s.class.startTime}</p>
                  </Link>
                  <div className="ml-4 shrink-0">
                    {s.cancelled ? (
                      <span className="px-2 py-0.5 bg-brand-red text-paper text-xs font-bold uppercase tracking-wide">
                        Cancelled
                      </span>
                    ) : alreadyCheckedIn ? (
                      <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-red border border-brand-red">
                        Checked In
                      </span>
                    ) : isToday ? (
                      <CheckinButton classSessionId={s.id} />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Attendance summary */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Attendance (Last 30 Days)</p>
        <div className="flex gap-4 flex-wrap mb-3">
          <div className="border border-smoke bg-paper px-5 py-4">
            <p className="text-2xl font-display font-bold text-ink">{attendanceRecords.length}</p>
            <p className="text-xs text-ash uppercase tracking-wide">Classes Attended</p>
          </div>
          <div className="border border-smoke bg-paper px-5 py-4">
            <p className="text-2xl font-display font-bold text-ink">{streak}</p>
            <p className="text-xs text-ash uppercase tracking-wide">Week Streak</p>
          </div>
        </div>
        {attendanceRecords.length > 0 && (
          <div className="flex flex-col gap-1">
            {attendanceRecords.slice(0, 5).map(r => (
              <div key={r.id} className="border border-smoke bg-paper px-4 py-2 flex items-center justify-between">
                <p className="text-sm text-ink">{r.classSession.class.title}</p>
                <p className="text-xs text-ash">
                  {new Date(r.classSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                </p>
              </div>
            ))}
          </div>
        )}
        {attendanceRecords.length === 0 && (
          <p className="text-ash text-sm italic">No attended classes in the last 30 days.</p>
        )}
      </div>

      {/* Recent journal entries */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Training Journal</p>
          <Link href="/journal" className="text-xs text-ash hover:text-ink transition-colors">View all →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <Link href="/journal/new" className="block border border-smoke bg-paper p-4 text-sm text-ash hover:border-steel transition-colors">
            No journal entries yet. Write your first entry →
          </Link>
        ) : (
          <div className="flex flex-col gap-2">
            {recentLogs.map(log => (
              <Link
                key={log.id}
                href={`/journal/${log.id}`}
                className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-ink">
                    {log.classSession ? log.classSession.class.title : 'General Entry'}
                  </p>
                  <p className="text-xs text-ash mt-0.5">
                    {log.classSession
                      ? new Date(log.classSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
                      : new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs text-ash">{log.isGuided ? 'Guided' : 'Free-form'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent forum activity */}
      {recentPosts.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Recent Forum Activity</p>
          <div className="flex flex-col gap-2">
            {recentPosts.map(p => (
              <Link
                key={p.id}
                href={`/forum/${p.forum.id}`}
                className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-xs text-ash mb-0.5">{p.forum.title}</p>
                  <p className="text-sm text-ink truncate">{p.content}</p>
                  <p className="text-xs text-ash mt-0.5">by {p.author.name ?? 'Unknown'}</p>
                </div>
                <p className="text-xs text-ash flex-shrink-0">
                  {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/schedule" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Schedule</p>
          <p className="text-slate text-sm">View classes and commit to sessions</p>
        </Link>
        <Link href="/profile" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">My Profile</p>
          <p className="text-slate text-sm">Belt, goals, competition history</p>
        </Link>
        <Link href="/forum" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Forums</p>
          <p className="text-slate text-sm">Class discussions and announcements</p>
        </Link>
        <Link href="/lessons" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Private Lessons</p>
          <p className="text-slate text-sm">Request or view your lesson history</p>
        </Link>
        {(session.user.role === 'instructor' || session.user.role === 'admin') && (
          <Link href="/instructor" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-steel">Instructor</p>
            <p className="text-slate text-sm">Rosters, attendance, lesson plans</p>
          </Link>
        )}
        {session.user.role === 'admin' && (
          <Link href="/admin" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-steel">Admin</p>
            <p className="text-slate text-sm">Users, classes, attendance reports</p>
          </Link>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-smoke">
        <DeleteAccountButton />
      </div>
    </div>
  )
}
