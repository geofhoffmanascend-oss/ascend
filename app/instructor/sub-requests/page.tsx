import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { SubRequestActions } from './SubRequestActions'

export default async function SubRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const open = await prisma.classSubRequest.findMany({
    where: { status: 'open' },
    include: {
      classSession: {
        include: { class: { select: { title: true, startTime: true, endTime: true, location: true } } },
      },
      requestedBy: { select: { id: true, name: true } },
    },
    orderBy: { classSession: { date: 'asc' } },
  })

  const myRequests = await prisma.classSubRequest.findMany({
    where: { requestedById: session.user.id, status: { in: ['open', 'filled'] } },
    include: {
      classSession: {
        include: { class: { select: { title: true, startTime: true, endTime: true } } },
      },
      claimedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Sub Requests</h1>
      </div>

      {/* Open requests from other instructors */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Open — Needs Coverage</p>
        {open.filter(r => r.requestedById !== session.user.id).length === 0 ? (
          <div className="border border-smoke bg-paper p-5">
            <p className="text-ash text-sm italic">No open sub requests from other instructors.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {open.filter(r => r.requestedById !== session.user.id).map(r => {
              const dateLabel = r.classSession.date.toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC',
              })
              return (
                <div key={r.id} className="border border-yellow-300 bg-yellow-50 p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink text-sm">{r.classSession.class.title}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {dateLabel} · {r.classSession.class.startTime}–{r.classSession.class.endTime}
                      {r.classSession.class.location && ` · ${r.classSession.class.location}`}
                    </p>
                    <p className="text-xs text-ash mt-0.5">Released by {r.requestedBy.name ?? 'Unknown'}</p>
                    {r.note && <p className="text-xs text-steel mt-1 italic">"{r.note}"</p>}
                  </div>
                  <SubRequestActions subReqId={r.id} action="claim" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My released sessions */}
      {myRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">My Released Sessions</p>
          <div className="flex flex-col gap-3">
            {myRequests.map(r => {
              const dateLabel = r.classSession.date.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
              })
              return (
                <div key={r.id} className="border border-smoke bg-paper p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink text-sm">{r.classSession.class.title}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {dateLabel} · {r.classSession.class.startTime}–{r.classSession.class.endTime}
                    </p>
                    {r.status === 'filled' && r.claimedBy && (
                      <p className="text-xs text-green-700 mt-1 font-medium">✓ Covered by {r.claimedBy.name}</p>
                    )}
                    {r.status === 'open' && (
                      <p className="text-xs text-yellow-700 mt-1">Waiting for coverage…</p>
                    )}
                  </div>
                  {r.status === 'open' && (
                    <SubRequestActions subReqId={r.id} action="cancel" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
