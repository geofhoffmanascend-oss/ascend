import type { Metadata } from "next"

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

export const metadata = { title: 'Lessons' }

export default async function LessonsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const lessons = await prisma.privateLesson.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { instructorId: session.user.id }],
    },
    include: {
      requester: { select: { name: true } },
      instructor: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  const pending = lessons.filter(l => l.status === 'pending')
  const confirmed = lessons.filter(l => l.status === 'confirmed')
  const past = lessons.filter(l => l.status === 'completed' || l.status === 'cancelled')

  function LessonCard({ lesson }: { lesson: typeof lessons[number] }) {
    const isRequester = lesson.requesterId === session!.user.id
    const otherPerson = isRequester ? lesson.instructor : lesson.requester
    return (
      <Link
        href={`/lessons/${lesson.id}`}
        className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-medium text-ink">
            {isRequester ? `with ${otherPerson.name}` : `from ${otherPerson.name}`}
          </p>
          <p className="text-xs text-ash mt-0.5">
            {new Date(lesson.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {' · '}{lesson.durationMins} min
            {lesson.location && ` · ${lesson.location}`}
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Lessons</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Private Lessons</h1>
        </div>
        <Link href="/lessons/new" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
          + Request
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {pending.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Pending</p>
            <div className="flex flex-col gap-2">{pending.map(l => <LessonCard key={l.id} lesson={l} />)}</div>
          </section>
        )}
        {confirmed.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Confirmed</p>
            <div className="flex flex-col gap-2">{confirmed.map(l => <LessonCard key={l.id} lesson={l} />)}</div>
          </section>
        )}
        {past.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Past</p>
            <div className="flex flex-col gap-2">{past.map(l => <LessonCard key={l.id} lesson={l} />)}</div>
          </section>
        )}
        {lessons.length === 0 && (
          <p className="text-ash text-sm italic">No private lessons yet.</p>
        )}
      </div>
    </div>
  )
}
