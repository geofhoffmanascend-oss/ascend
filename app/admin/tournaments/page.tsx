import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export const metadata: Metadata = { title: 'Tournaments' }

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-mist text-steel',
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
}

export default async function AdminTournamentsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin')) redirect('/dashboard')

  const gymId = session.user.gymId
  if (!gymId) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="text-ash text-sm">Your account is not associated with a gym. Contact a site admin.</p>
    </div>
  )

  const [gym, tournaments] = await Promise.all([
    prisma.gym.findUnique({ where: { id: gymId }, select: { name: true, participatingStatus: true } }),
    prisma.tournament.findMany({
      where: { gymId },
      include: { _count: { select: { divisions: true } } },
      orderBy: { date: 'desc' },
    }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Tournaments</h1>
        </div>
        {gym?.participatingStatus === 'participating' ? (
          <Link href="/admin/tournaments/new" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
            + Create Tournament
          </Link>
        ) : (
          <p className="text-xs text-ash border border-smoke px-3 py-2 max-w-xs text-right">
            Tournament creation requires a Participating gym subscription.
          </p>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div className="border border-smoke bg-paper p-12 text-center">
          <p className="text-ash text-sm">No tournaments yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map(t => (
            <Link
              key={t.id}
              href={`/admin/tournaments/${t.id}`}
              className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-ink">{t.title}</p>
                <p suppressHydrationWarning className="text-xs text-ash mt-0.5">
                  {new Date(t.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}{t._count.divisions} division{t._count.divisions !== 1 ? 's' : ''}
                  {' · '}{t.format.replace('_', ' ')}
                </p>
              </div>
              <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[t.status]}`}>
                {t.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
