import Link from 'next/link'
import prisma from '@/lib/database'

export const metadata = { title: 'Site Admin' }

export default async function SiteAdminPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalGyms, participatingGyms, totalUsers, unaffiliatedUsers, pendingEventsCount, newGymsCount, recentGyms, pendingEvents] = await Promise.all([
    prisma.gym.count(),
    prisma.gym.count({ where: { participatingStatus: 'participating' } }),
    prisma.user.count(),
    prisma.user.count({ where: { gymId: null } }),
    prisma.publicEvent.count({ where: { status: 'pending' } }),
    prisma.gym.count({ where: { participatingStatus: 'free', createdAt: { gte: sevenDaysAgo } } }),
    prisma.gym.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, slug: true, participatingStatus: true, createdAt: true } }),
    prisma.publicEvent.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' }, take: 3, select: { id: true, title: true, type: true, city: true, state: true, startDate: true } }),
  ])

  const TIER_STYLES: Record<string, string> = {
    participating: 'bg-green-100 text-green-700',
    free: 'bg-mist text-steel',
    inactive: 'bg-red-50 text-red-600',
  }

  const EVENT_TYPE_LABELS: Record<string, string> = {
    open_mat: 'Open Mat', competition: 'Competition', seminar: 'Seminar', other: 'Other',
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Platform</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-smoke bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Total Gyms</p>
          <p className="font-display text-3xl font-bold text-ink">{totalGyms}</p>
          <p className="text-xs text-ash mt-1">{participatingGyms} participating</p>
        </div>
        <div className="border border-smoke bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Total Users</p>
          <p className="font-display text-3xl font-bold text-ink">{totalUsers}</p>
          <p className="text-xs text-ash mt-1">{unaffiliatedUsers} unaffiliated</p>
        </div>
        <Link href="/site-admin/events" className={`border bg-paper p-5 hover:border-steel transition-colors ${pendingEventsCount > 0 ? 'border-amber-300' : 'border-smoke'}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Pending Events</p>
          <p className="font-display text-3xl font-bold text-ink">{pendingEventsCount}</p>
          <p className={`text-xs mt-1 ${pendingEventsCount > 0 ? 'text-amber-600' : 'text-ash'}`}>
            {pendingEventsCount > 0 ? 'Requires review →' : 'All clear'}
          </p>
        </Link>
        <Link href="/site-admin/gyms/new-review" className="border border-smoke bg-paper p-5 hover:border-steel transition-colors">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">New Gyms (7d)</p>
          <p className="font-display text-3xl font-bold text-ink">{newGymsCount}</p>
          <p className="text-xs text-ash mt-1">Review for outreach →</p>
        </Link>
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent gyms */}
        <div className="border border-smoke bg-paper p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-steel">Recent Gyms</p>
            <Link href="/site-admin/gyms" className="text-xs text-brand-red hover:underline">View all →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentGyms.map(gym => (
              <div key={gym.id} className="flex items-center justify-between gap-2">
                <Link href={`/site-admin/gyms/${gym.id}`} className="text-sm text-ink hover:text-brand-red transition-colors truncate">{gym.name}</Link>
                <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs font-bold uppercase ${TIER_STYLES[gym.participatingStatus]}`}>
                  {gym.participatingStatus}
                </span>
              </div>
            ))}
            {recentGyms.length === 0 && <p className="text-sm text-ash italic">No gyms yet.</p>}
          </div>
        </div>

        {/* Pending events */}
        <div className="border border-smoke bg-paper p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-steel">Pending Events</p>
            <Link href="/site-admin/events" className="text-xs text-brand-red hover:underline">Review all →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {pendingEvents.map(e => (
              <div key={e.id}>
                <p className="text-sm text-ink">{e.title}</p>
                <p className="text-xs text-ash">{EVENT_TYPE_LABELS[e.type]} · {[e.city, e.state].filter(Boolean).join(', ')} · {e.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            ))}
            {pendingEvents.length === 0 && <p className="text-sm text-ash italic">No pending events.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
