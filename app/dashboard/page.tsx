import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getMondayOfWeek } from '@/lib/generateSessions'
import { getEffectiveFeatures } from '@/lib/features'
import { DeleteAccountButton } from '@/app/components/DeleteAccountButton'
import { CheckinButton } from '@/app/components/CheckinButton'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const features = await getEffectiveFeatures(session)

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0)

  const [commitments, attendanceRecords, recentLogs, recentPosts, unreadMessages] = await Promise.all([
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
  prisma.directMessage.count({
    where: { recipientId: session.user.id, readAt: null },
  }),
])

  const hasGym = !!session.user.gymId
  const isStaff = session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')

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

      {/* ── THIS WEEK ── upcoming committed classes */}
      {features.schedule && (
      <div className="mb-10">
        <ZoneLabel>This Week</ZoneLabel>
        {commitments.length === 0 ? (
          hasGym ? (
            <div className="border border-smoke bg-paper p-5">
              <p className="text-ash text-sm">No classes registered this week. <Link href="/schedule" className="text-brand-red hover:text-brand-red-dark font-medium">View schedule →</Link></p>
            </div>
          ) : (
            <Link href="/events" className="block border border-smoke border-l-2 border-l-brand-red bg-paper p-5 hover:border-steel transition-colors">
              <p className="text-sm font-medium text-ink">Post or find local open mats, tournaments &amp; seminars</p>
              <p className="text-xs text-ash mt-1">You're not at a gym yet — explore what's happening near you. <span className="text-brand-red font-medium">Browse events →</span></p>
            </Link>
          )
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
        {hasGym && commitments.length > 0 && (
          <Link href="/schedule" className="inline-block mt-3 text-xs font-medium text-ash hover:text-ink transition-colors">View full schedule →</Link>
        )}
      </div>
      )}

      {/* ── COMMUNITY ── */}
      <div className="mb-10">
        <ZoneLabel>Community</ZoneLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Tile href="/messages" icon="✉" accent="ink" title="Messages" subtitle={unreadMessages > 0 ? `${unreadMessages} new` : 'Direct messages'} badge={unreadMessages} />
          {features.forums && <Tile href="/forum" icon="💬" accent="ink" title="Forums" subtitle="Discussions & announcements" />}
          {features.eventsNav && <Tile href="/events" icon="📅" accent="ink" title="Events" subtitle="Open mats, comps, seminars" />}
        </div>

      {/* Recent forum activity */}
      {features.forums && recentPosts.length > 0 && (
        <div>
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
      </div>

      {/* ── YOU ── */}
      <div className="mb-10">
        <ZoneLabel>You</ZoneLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Tile href="/profile" icon="👤" accent="steel" title="My Profile" subtitle="Belt, goals, history" />
          <Tile href="/invite" icon="✉️" accent="steel" title="Invite Friends" subtitle="Share your link" />
          {features.journal && <Tile href="/journal" icon="📓" accent="steel" title="Journal" subtitle="Log your training" />}
          {features.privateLessons && <Tile href="/lessons" icon="🎯" accent="steel" title="Private Lessons" subtitle="Request or view" />}
        </div>

        {/* Attendance — only when there's something to show */}
        {attendanceRecords.length > 0 && (
          <div className="mb-6">
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
          </div>
        )}

      {/* Recent journal entries */}
      {features.journal && (
      <div>
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
      )}

      </div>

      {/* ── MANAGE ── staff only */}
      {isStaff && (
        <div className="mb-10">
          <ZoneLabel>Manage</ZoneLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Tile href="/instructor" icon="📋" accent="red" title="Instructor" subtitle="Rosters, attendance, plans" />
            {session.user.roles?.includes('admin') && (
              <Tile href="/admin" icon="⚙️" accent="red" title="Admin" subtitle="Users, classes, reports" />
            )}
          </div>
        </div>
      )}

      {/* Dev-only convenience tool — hidden in production (beta users shouldn't see it) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 pt-8 border-t border-smoke">
          <DeleteAccountButton />
        </div>
      )}
    </div>
  )
}

function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-display text-sm font-bold tracking-widest uppercase text-ink">{children}</span>
      <span className="flex-1 h-px bg-smoke" />
    </div>
  )
}

const ACCENTS: Record<string, string> = {
  red: 'border-l-brand-red',
  ink: 'border-l-ink',
  steel: 'border-l-steel',
}

function Tile({
  href, icon, title, subtitle, accent, badge,
}: {
  href: string; icon: string; title: string; subtitle: string; accent: keyof typeof ACCENTS; badge?: number
}) {
  return (
    <Link
      href={href}
      className={`relative border border-smoke border-l-2 ${ACCENTS[accent]} bg-paper hover:border-steel transition-colors p-5 flex items-center gap-4`}
    >
      <span className="w-10 h-10 flex items-center justify-center bg-mist text-lg flex-shrink-0" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-slate mt-0.5">{subtitle}</p>
      </div>
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-paper text-[11px] font-bold leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
