import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export const metadata: Metadata = { title: 'Tournaments' }

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
}

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const gymId = session.user.gymId ?? null

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ['open', 'in_progress', 'complete'] },
      OR: [
        { isPublic: true },
        ...(gymId ? [{ gymId }] : []),
      ],
    },
    include: {
      gym: { select: { name: true, slug: true } },
      _count: { select: { divisions: true } },
    },
    orderBy: { date: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Community</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Tournaments</h1>
        <p className="text-sm text-ash mt-1">In-house scrimmages and competitions at your gym.</p>
      </div>

      {tournaments.length === 0 ? (
        <div className="border border-smoke bg-paper p-12 text-center">
          <p className="text-ash text-sm">No tournaments scheduled.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map(t => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold text-ink">{t.title}</p>
                  <p suppressHydrationWarning className="text-xs text-ash mt-0.5">
                    {new Date(t.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {t.gym && ` · ${t.gym.name}`}
                    {' · '}{t._count.divisions} division{t._count.divisions !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[t.status] ?? 'bg-mist text-steel'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
