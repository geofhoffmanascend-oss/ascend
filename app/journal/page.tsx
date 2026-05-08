import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export default async function JournalPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const logs = await prisma.trainingLog.findMany({
    where: { userId: session.user.id },
    include: {
      classSession: { select: { date: true, class: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Journal</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Training Journal</h1>
        </div>
        <Link
          href="/journal/new"
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
        >
          + New Entry
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="border border-smoke bg-paper p-10 text-center">
          <p className="text-ash text-sm">No journal entries yet.</p>
          <Link href="/journal/new" className="text-sm text-brand-red hover:underline mt-2 inline-block">
            Write your first entry
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map(log => (
            <Link
              key={log.id}
              href={`/journal/${log.id}`}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink font-medium">
                  {log.classSession
                    ? log.classSession.class.title
                    : 'General Entry'}
                </p>
                <p className="text-xs text-ash mt-0.5">
                  {log.classSession
                    ? new Date(log.classSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
                    : new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {log.isPrivate && (
                  <span className="px-1.5 py-0.5 bg-mist text-steel text-xs font-bold uppercase tracking-wide">Private</span>
                )}
                <span className="px-1.5 py-0.5 bg-mist text-steel text-xs font-bold uppercase tracking-wide">
                  {log.isGuided ? 'Guided' : 'Free-form'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
