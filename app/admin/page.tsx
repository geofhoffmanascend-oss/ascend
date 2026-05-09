import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getMondayOfWeek } from '@/lib/generateSessions'

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setUTCHours(23, 59, 59, 999)

  const [totalStudents, totalInstructors, todaySessions, newSignups] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.user.count({ where: { role: { in: ['instructor', 'admin'] } } }),
    prisma.classSession.count({ where: { date: { gte: today, lte: todayEnd }, class: { isActive: true } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: totalStudents },
          { label: 'Instructors', value: totalInstructors },
          { label: 'Classes Today', value: todaySessions },
          { label: 'New This Week', value: newSignups },
        ].map(s => (
          <div key={s.label} className="border border-smoke bg-paper p-5">
            <p className="text-2xl font-display font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ash uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/admin/users" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Users</p>
          <p className="text-slate text-sm">Manage students and instructors</p>
        </Link>
        <Link href="/admin/classes" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Classes</p>
          <p className="text-slate text-sm">Create and manage class schedule</p>
        </Link>
        <Link href="/admin/attendance" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Attendance</p>
          <p className="text-slate text-sm">Reports and history</p>
        </Link>
        <Link href="/admin/forum" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Forums</p>
          <p className="text-slate text-sm">Moderation and subscriptions</p>
        </Link>
        <Link href="/admin/feedback" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Feedback</p>
          <p className="text-slate text-sm">Student class feedback</p>
        </Link>
        <Link href="/admin/store" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Gear Store</p>
          <p className="text-slate text-sm">Products, orders, and pickup confirmation</p>
        </Link>
        <Link href="/admin/settings" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Gym Settings</p>
          <p className="text-slate text-sm">Review URL and gym configuration</p>
        </Link>
        <Link href="/instructor" className="border border-smoke bg-paper hover:border-steel transition-colors p-5 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel">Instructor View</p>
          <p className="text-slate text-sm">Today's sessions and rosters</p>
        </Link>
      </div>
    </div>
  )
}
