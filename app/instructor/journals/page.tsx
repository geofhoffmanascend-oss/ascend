import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { SharedWithMe } from '../../journal/SharedWithMe'

export const metadata = { title: 'Member Journals' }

export default async function InstructorJournalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const roles = session.user.roles ?? []
  if (!roles.includes('instructor') && !roles.includes('admin')) redirect('/dashboard')

  const gymId = session.user.gymId ?? null

  const [sharedRows, studentLogs] = await Promise.all([
    // Entries explicitly shared with me.
    prisma.journalShare.findMany({
      where: { toUserId: session.user.id },
      include: { trainingLog: { select: { id: true, userId: true, title: true, createdAt: true, classSession: { select: { class: { select: { title: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    // My gym's members' recent non-private entries.
    gymId ? prisma.trainingLog.findMany({
      where: { isPrivate: false, userId: { not: session.user.id }, user: { gymId } },
      select: { id: true, title: true, createdAt: true, user: { select: { name: true } }, classSession: { select: { class: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 40,
    }) : Promise.resolve([]),
  ])

  const ownerNames = new Map(
    (await prisma.user.findMany({ where: { id: { in: sharedRows.map(s => s.trainingLog.userId) } }, select: { id: true, name: true } }))
      .map(u => [u.id, u.name ?? 'Someone'])
  )
  const sharedItems = sharedRows.map(s => ({
    id: s.id,
    logId: s.trainingLog.id,
    title: s.trainingLog.title || s.trainingLog.classSession?.class.title || 'Journal Entry',
    ownerName: ownerNames.get(s.trainingLog.userId) ?? 'Someone',
    status: s.status as 'active' | 'pending',
    date: new Date(s.trainingLog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2"><Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link></div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3"><span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span></div>
        <h1 className="font-display text-2xl text-ink">Member Journals</h1>
        <p className="text-slate text-sm mt-2">Entries shared with you, plus your members' recent non-private entries.</p>
      </div>

      <SharedWithMe items={sharedItems} />

      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Members' recent entries</p>
      {studentLogs.length === 0 ? (
        <p className="text-ash text-sm italic">No non-private entries from your members yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {studentLogs.map(l => (
            <Link key={l.id} href={`/journal/${l.id}`} className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-ink font-medium truncate">{l.title || l.classSession?.class.title || 'Journal Entry'}</p>
                <p className="text-xs text-ash mt-0.5">{l.user.name ?? 'Member'} · {new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <span className="text-xs text-ash shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
