import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-mist text-steel',
  cancelled: 'bg-mist text-ash',
}

export default async function InstructorLessonsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const lessons = await prisma.privateLesson.findMany({
    where: { instructorId: session.user.id },
    include: { requester: { select: { name: true, belt: true } } },
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
  })

  const pending = lessons.filter(l => l.status === 'pending')
  const confirmed = lessons.filter(l => l.status === 'confirmed')
  const past = lessons.filter(l => l.status === 'completed' || l.status === 'cancelled')

  function LessonRow({ lesson }: { lesson: typeof lessons[number] }) {
    return (
      <Link
        href={`/lessons/${lesson.id}`}
        className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-medium text-ink">from {lesson.requester.name}</p>
          <p className="text-xs text-ash mt-0.5">
            {new Date(lesson.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {' · '}{lesson.durationMins} min
          </p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide flex-shrink-0 ml-4 ${STATUS_STYLES[lesson.status]}`}>
          {lesson.status}
        </span>
      </Link>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Lesson Requests</h1>
      </div>

      <div className="flex flex-col gap-6">
        {pending.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Pending ({pending.length})</p>
            <div className="flex flex-col gap-2">{pending.map(l => <LessonRow key={l.id} lesson={l} />)}</div>
          </section>
        )}
        {confirmed.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Confirmed</p>
            <div className="flex flex-col gap-2">{confirmed.map(l => <LessonRow key={l.id} lesson={l} />)}</div>
          </section>
        )}
        {past.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Past</p>
            <div className="flex flex-col gap-2">{past.map(l => <LessonRow key={l.id} lesson={l} />)}</div>
          </section>
        )}
        {lessons.length === 0 && <p className="text-ash text-sm italic">No lesson requests.</p>}
      </div>
    </div>
  )
}
