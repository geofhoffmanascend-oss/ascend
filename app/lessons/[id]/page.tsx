import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { LessonDetailClient } from './LessonDetailClient'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-mist text-steel',
  cancelled: 'bg-mist text-ash',
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const [lesson, rawMessages] = await Promise.all([
    prisma.privateLesson.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, belt: true } },
        instructor: { select: { id: true, name: true } },
        uke: { select: { name: true } },
      },
    }),
    prisma.lessonMessage.findMany({
      where: { lessonId: id },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!lesson) notFound()
  const isParticipant = lesson.requesterId === session.user.id || lesson.instructorId === session.user.id
  if (!isParticipant && !session.user.roles?.includes('admin')) redirect('/lessons')

  const isInstructor = lesson.instructorId === session.user.id || session.user.roles?.includes('admin')

  // Map authorId → name from participants
  const nameMap: Record<string, string> = {
    [lesson.requesterId]: lesson.requester.name ?? 'Unknown',
    [lesson.instructorId]: lesson.instructor.name ?? 'Instructor',
  }
  const messages = rawMessages.map(m => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    author: { name: nameMap[m.authorId] ?? 'Unknown' },
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/lessons" className="text-xs text-ash hover:text-ink transition-colors">← Lessons</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Private Lesson</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl text-ink">
            {lesson.requester.name} with {lesson.instructor.name}
          </h1>
          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[lesson.status]}`}>
            {lesson.status}
          </span>
        </div>
      </div>

      <div className="border border-smoke bg-paper p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-ash mb-1">Date & Time</p>
            <p className="text-ink">{new Date(lesson.scheduledAt).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-xs text-ash mb-1">Duration</p>
            <p className="text-ink">{lesson.durationMins} minutes</p>
          </div>
          {lesson.location && (
            <div>
              <p className="text-xs text-ash mb-1">Location</p>
              <p className="text-ink">{lesson.location}</p>
            </div>
          )}
          {lesson.uke && (
            <div>
              <p className="text-xs text-ash mb-1">Uke</p>
              <p className="text-ink">{lesson.uke.name}</p>
            </div>
          )}
          {lesson.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-ash mb-1">Notes</p>
              <p className="text-ink">{lesson.notes}</p>
            </div>
          )}
        </div>
      </div>

      <LessonDetailClient
        lessonId={lesson.id}
        status={lesson.status}
        isInstructor={isInstructor}
        messages={messages}
      />
    </div>
  )
}
