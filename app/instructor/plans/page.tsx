import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export default async function LessonPlansPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const plans = await prisma.lessonPlan.findMany({
    where: { instructorId: session.user.id },
    include: { class: { select: { title: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Lesson Plans</h1>
        </div>
        <Link
          href="/instructor/plans/new"
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
        >
          + New Plan
        </Link>
      </div>

      {plans.length === 0 && (
        <p className="text-ash text-sm italic">No lesson plans yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {plans.map(p => (
          <Link
            key={p.id}
            href={`/instructor/plans/${p.id}`}
            className="border border-smoke bg-paper p-5 hover:border-steel transition-colors flex items-start justify-between"
          >
            <div>
              <p className="font-medium text-ink">{p.title}</p>
              {p.class && <p className="text-xs text-ash mt-0.5">{p.class.title}</p>}
              {p.techniques && (
                <p className="text-xs text-slate mt-1 line-clamp-1">{p.techniques}</p>
              )}
            </div>
            <p className="text-xs text-ash flex-shrink-0 ml-4">
              {new Date(p.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
