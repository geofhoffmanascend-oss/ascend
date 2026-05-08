import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; from?: string; to?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const { classId, from, to } = await searchParams

  const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); d.setUTCHours(0,0,0,0); return d })()
  const toDate = to ? (() => { const d = new Date(to); d.setUTCHours(23,59,59,999); return d })() : new Date()

  const [classes, records] = await Promise.all([
    prisma.class.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.attendance.findMany({
      where: {
        classSession: {
          date: { gte: fromDate, lte: toDate },
          ...(classId && { classId }),
        },
      },
      include: {
        user: { select: { name: true, belt: true } },
        classSession: { select: { date: true, class: { select: { title: true } } } },
      },
      orderBy: { classSession: { date: 'desc' } },
      take: 200,
    }),
  ])

  const totalPresent = records.filter(r => r.attended).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Attendance Reports</h1>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-6">
        <select name="classId" defaultValue={classId ?? ''} className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="date" name="from" defaultValue={from ?? fromDate.toISOString().split('T')[0]}
          className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors" />
        <input type="date" name="to" defaultValue={to ?? toDate.toISOString().split('T')[0]}
          className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors" />
        <button type="submit" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
          Filter
        </button>
      </form>

      <div className="flex gap-6 mb-6">
        <div className="border border-smoke bg-paper px-5 py-4">
          <p className="text-2xl font-display font-bold text-ink">{records.length}</p>
          <p className="text-xs text-ash uppercase tracking-wide">Total Records</p>
        </div>
        <div className="border border-smoke bg-paper px-5 py-4">
          <p className="text-2xl font-display font-bold text-ink">{totalPresent}</p>
          <p className="text-xs text-ash uppercase tracking-wide">Present</p>
        </div>
        <div className="border border-smoke bg-paper px-5 py-4">
          <p className="text-2xl font-display font-bold text-ink">
            {records.length ? Math.round((totalPresent / records.length) * 100) : 0}%
          </p>
          <p className="text-xs text-ash uppercase tracking-wide">Rate</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {records.map(r => (
          <div key={r.id} className="border border-smoke bg-paper px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-ink">{r.user.name}</p>
              <p className="text-xs text-ash">{r.classSession.class.title} · {r.classSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold uppercase ${r.attended ? 'bg-green-100 text-green-700' : 'bg-mist text-ash'}`}>
              {r.attended ? 'Present' : 'Absent'}
            </span>
          </div>
        ))}
        {records.length === 0 && <p className="text-ash text-sm italic p-4">No attendance records for this period.</p>}
      </div>
    </div>
  )
}
