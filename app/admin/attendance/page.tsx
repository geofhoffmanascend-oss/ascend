import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

type SearchParams = { classId?: string; from?: string; to?: string; view?: string }

export default async function AttendanceReportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const { classId, from, to, view = 'records' } = await searchParams

  const fromDate = from
    ? new Date(from)
    : (() => { const d = new Date(); d.setDate(d.getDate() - 30); d.setUTCHours(0,0,0,0); return d })()
  const toDate = to
    ? (() => { const d = new Date(to); d.setUTCHours(23,59,59,999); return d })()
    : new Date()

  const classes = await prisma.class.findMany({
    select: { id: true, title: true, instructor: { select: { id: true, name: true } } },
    orderBy: { title: 'asc' },
  })

  const records = await prisma.attendance.findMany({
    where: {
      classSession: {
        date: { gte: fromDate, lte: toDate },
        ...(classId && { classId }),
      },
    },
    include: {
      user: { select: { id: true, name: true, belt: true } },
      classSession: {
        select: {
          date: true,
          class: { select: { id: true, title: true, instructor: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { classSession: { date: 'desc' } },
    take: 500,
  })

  const totalPresent = records.filter(r => r.attended).length

  // ── By-class breakdown ──────────────────────────────────────────────────────
  const byClass: Record<string, { title: string; present: number; total: number }> = {}
  for (const r of records) {
    const id = r.classSession.class.id
    if (!byClass[id]) byClass[id] = { title: r.classSession.class.title, present: 0, total: 0 }
    byClass[id].total++
    if (r.attended) byClass[id].present++
  }

  // ── By-instructor breakdown ─────────────────────────────────────────────────
  const byInstructor: Record<string, { name: string; present: number; total: number }> = {}
  for (const r of records) {
    const { id, name } = r.classSession.class.instructor
    if (!byInstructor[id]) byInstructor[id] = { name: name ?? 'Unknown', present: 0, total: 0 }
    byInstructor[id].total++
    if (r.attended) byInstructor[id].present++
  }

  // ── By-student breakdown ────────────────────────────────────────────────────
  const byStudent: Record<string, { name: string; belt: string; present: number; total: number }> = {}
  for (const r of records) {
    const { id, name, belt } = r.user
    if (!byStudent[id]) byStudent[id] = { name: name ?? 'Unknown', belt, present: 0, total: 0 }
    byStudent[id].total++
    if (r.attended) byStudent[id].present++
  }

  const tabs = [
    { key: 'records',    label: 'Records' },
    { key: 'class',      label: 'By Class' },
    { key: 'instructor', label: 'By Instructor' },
    { key: 'student',    label: 'By Student' },
  ]

  function tabUrl(key: string) {
    const p = new URLSearchParams({ view: key })
    if (classId) p.set('classId', classId)
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    return `/admin/attendance?${p}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Attendance Reports</h1>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-6">
        <input type="hidden" name="view" value={view} />
        <select name="classId" defaultValue={classId ?? ''} className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="date" name="from" defaultValue={from ?? fromDate.toISOString().split('T')[0]}
          className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors" />
        <input type="date" name="to" defaultValue={to ?? toDate.toISOString().split('T')[0]}
          className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors" />
        <button type="submit" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
          Filter
        </button>
      </form>

      {/* Summary stats */}
      <div className="flex gap-4 mb-6">
        <div className="border border-smoke bg-paper px-5 py-4">
          <p className="text-2xl font-display font-bold text-ink">{records.length}</p>
          <p className="text-xs text-ash uppercase tracking-wide">Records</p>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-smoke">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={tabUrl(t.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              view === t.key
                ? 'border-b-2 border-brand-red text-brand-red -mb-px'
                : 'text-steel hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Records view */}
      {view === 'records' && (
        <div className="flex flex-col gap-1">
          {records.map(r => (
            <div key={r.id} className="border border-smoke bg-paper px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink">{r.user.name}</p>
                <p className="text-xs text-ash">
                  {r.classSession.class.title} · {r.classSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  {r.checkedInAt && <span className="ml-2 text-green-600">• App check-in</span>}
                </p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold uppercase ${r.attended ? 'bg-green-100 text-green-700' : 'bg-mist text-ash'}`}>
                {r.attended ? 'Present' : 'Absent'}
              </span>
            </div>
          ))}
          {records.length === 0 && <p className="text-ash text-sm italic p-4">No attendance records for this period.</p>}
        </div>
      )}

      {/* By-class view */}
      {view === 'class' && (
        <div className="flex flex-col gap-1">
          {Object.entries(byClass).sort((a, b) => b[1].total - a[1].total).map(([id, data]) => (
            <div key={id} className="border border-smoke bg-paper px-5 py-3 flex items-center justify-between">
              <p className="text-sm text-ink font-medium">{data.title}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ash">{data.total} records</span>
                <span className="text-green-700 font-bold">{data.present} present</span>
                <span className="text-steel">{data.total ? Math.round((data.present / data.total) * 100) : 0}%</span>
              </div>
            </div>
          ))}
          {Object.keys(byClass).length === 0 && <p className="text-ash text-sm italic p-4">No data.</p>}
        </div>
      )}

      {/* By-instructor view */}
      {view === 'instructor' && (
        <div className="flex flex-col gap-1">
          {Object.entries(byInstructor).sort((a, b) => b[1].total - a[1].total).map(([id, data]) => (
            <div key={id} className="border border-smoke bg-paper px-5 py-3 flex items-center justify-between">
              <p className="text-sm text-ink font-medium">{data.name}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ash">{data.total} records</span>
                <span className="text-green-700 font-bold">{data.present} present</span>
                <span className="text-steel">{data.total ? Math.round((data.present / data.total) * 100) : 0}%</span>
              </div>
            </div>
          ))}
          {Object.keys(byInstructor).length === 0 && <p className="text-ash text-sm italic p-4">No data.</p>}
        </div>
      )}

      {/* By-student view */}
      {view === 'student' && (
        <div className="flex flex-col gap-1">
          {Object.entries(byStudent)
            .sort((a, b) => b[1].present - a[1].present)
            .map(([id, data]) => (
              <div key={id} className="border border-smoke bg-paper px-5 py-3 flex items-center justify-between">
                <div>
                  <Link href={`/admin/users/${id}`} className="text-sm text-ink font-medium hover:text-brand-red transition-colors">
                    {data.name}
                  </Link>
                  <p className="text-xs text-ash capitalize">{data.belt} belt</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-ash">{data.total} classes</span>
                  <span className="text-green-700 font-bold">{data.present} attended</span>
                  <span className="text-steel">{data.total ? Math.round((data.present / data.total) * 100) : 0}%</span>
                </div>
              </div>
            ))}
          {Object.keys(byStudent).length === 0 && <p className="text-ash text-sm italic p-4">No data.</p>}
        </div>
      )}
    </div>
  )
}
