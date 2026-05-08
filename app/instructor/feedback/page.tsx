import { requireInstructor } from '@/lib/instructorAuth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { FeedbackRow } from '@/app/components/FeedbackRow'

export default async function InstructorFeedbackPage() {
  await requireInstructor()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const feedback = await prisma.classFeedback.findMany({
    where: { classSession: { class: { instructorId: session.user.id } } },
    include: {
      user: { select: { name: true, belt: true } },
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const counts = {
    positive: feedback.filter(f => f.sentiment === 'positive').length,
    neutral:  feedback.filter(f => f.sentiment === 'neutral').length,
    negative: feedback.filter(f => f.sentiment === 'negative').length,
    concern:  feedback.filter(f => f.sentiment === 'concern').length,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Class Feedback</h1>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        {([['positive','bg-green-100 text-green-700'],['neutral','bg-yellow-100 text-yellow-700'],['negative','bg-red-100 text-brand-red'],['concern','bg-orange-100 text-orange-700']] as const).map(([s, cls]) => (
          <div key={s} className={`px-4 py-3 ${cls}`}>
            <p className="text-xl font-bold font-display">{counts[s as keyof typeof counts]}</p>
            <p className="text-xs uppercase tracking-wide capitalize">{s}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {feedback.map(f => (
          <FeedbackRow key={f.id} feedback={{
            ...f,
            createdAt: f.createdAt.toISOString(),
            classSession: { ...f.classSession, date: f.classSession.date.toISOString() },
            responses: f.responses as { question: string; answer: string }[],
          }} />
        ))}
        {feedback.length === 0 && <p className="text-ash text-sm italic p-4">No feedback for your classes yet.</p>}
      </div>
    </div>
  )
}
