import { requireAdmin } from '@/lib/adminAuth'
import Link from 'next/link'
import prisma from '@/lib/database'
import { FeedbackSentiment } from '@prisma/client'
import { FeedbackRow } from '@/app/components/FeedbackRow'

type SearchParams = { sentiment?: string; classId?: string }

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()

  const { sentiment, classId } = await searchParams

  const classes = await prisma.class.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } })

  const feedback = await prisma.classFeedback.findMany({
    where: {
      ...(sentiment && { sentiment: sentiment as FeedbackSentiment }),
      ...(classId && { classSession: { classId } }),
    },
    include: {
      user: { select: { name: true, belt: true } },
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const counts = {
    positive: feedback.filter(f => f.sentiment === 'positive').length,
    neutral:  feedback.filter(f => f.sentiment === 'neutral').length,
    negative: feedback.filter(f => f.sentiment === 'negative').length,
    concern:  feedback.filter(f => f.sentiment === 'concern').length,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Class Feedback</h1>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap mb-6">
        {([['positive','bg-green-100 text-green-700'],['neutral','bg-yellow-100 text-yellow-700'],['negative','bg-red-100 text-brand-red'],['concern','bg-orange-100 text-orange-700']] as const).map(([s, cls]) => (
          <div key={s} className={`px-4 py-3 ${cls}`}>
            <p className="text-xl font-bold font-display">{counts[s]}</p>
            <p className="text-xs uppercase tracking-wide capitalize">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-6">
        <select name="sentiment" defaultValue={sentiment ?? ''} className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">All sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
          <option value="concern">Concern</option>
        </select>
        <select name="classId" defaultValue={classId ?? ''} className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">Filter</button>
      </form>

      <div className="flex flex-col gap-2">
        {feedback.map(f => (
          <FeedbackRow key={f.id} feedback={{
            ...f,
            createdAt: f.createdAt.toISOString(),
            classSession: { ...f.classSession, date: f.classSession.date.toISOString() },
            responses: f.responses as { question: string; answer: string }[],
          }} />
        ))}
        {feedback.length === 0 && <p className="text-ash text-sm italic p-4">No feedback yet.</p>}
      </div>
    </div>
  )
}
