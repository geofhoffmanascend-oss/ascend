import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
}

export default async function AdminClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const classes = await prisma.class.findMany({
    include: { instructor: { select: { name: true } } },
    orderBy: [{ isActive: 'desc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Classes</h1>
        </div>
        <Link href="/admin/classes/new" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
          + New Class
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {classes.map(cls => (
          <Link
            key={cls.id}
            href={`/admin/classes/${cls.id}`}
            className={`border border-smoke bg-paper px-5 py-4 hover:border-steel transition-colors flex items-center justify-between ${!cls.isActive ? 'opacity-60' : ''}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink">{cls.title}</p>
                {!cls.isActive && <span className="px-1.5 py-0.5 text-xs bg-mist text-ash font-bold uppercase">Inactive</span>}
              </div>
              <p className="text-sm text-ash mt-0.5">
                {DAY_LABELS[cls.dayOfWeek]} · {cls.startTime}–{cls.endTime} · {TYPE_LABELS[cls.type] ?? cls.type}
                {cls.location && ` · ${cls.location}`}
              </p>
              <p className="text-xs text-ash">{cls.instructor.name}</p>
            </div>
            {cls.maxStudents && <p className="text-xs text-ash flex-shrink-0 ml-4">Max {cls.maxStudents}</p>}
          </Link>
        ))}
        {classes.length === 0 && <p className="text-ash text-sm italic p-4">No classes yet.</p>}
      </div>
    </div>
  )
}
