import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'

export const metadata = { title: 'Match Console' }

export default async function ConsoleIndex() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const tables = await prisma.matchTable.findMany({
    where: {
      OR: [
        { createdById: session.user.id },
        { assignments: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, label: true, status: true, aName: true, bName: true,
      rulesetId: true, winnerSide: true,
    },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper">
            Match Console
          </span>
          <h1 className="font-display text-2xl font-bold text-ink mt-3">Live Matches</h1>
        </div>
        <Link
          href="/console/new"
          className="bg-brand-red text-paper font-bold text-sm tracking-wide px-4 py-2 hover:bg-red-700 transition-colors"
        >
          New Match
        </Link>
      </div>

      {tables.length === 0 ? (
        <p className="text-slate text-sm">No matches yet. Create one to run a timer + scoreboard.</p>
      ) : (
        <div className="space-y-2">
          {tables.map(t => (
            <Link
              key={t.id}
              href={`/console/${t.id}`}
              className="block border border-smoke bg-paper p-4 hover:border-steel transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-ink">{t.label}</p>
                  <p className="text-sm text-slate">{t.aName} vs {t.bName}</p>
                  <p className="text-xs text-ash mt-1">{getRuleset(t.rulesetId)?.name ?? 'Custom'}</p>
                </div>
                <StatusPill status={t.status} winnerSide={t.winnerSide} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status, winnerSide }: { status: string; winnerSide: string | null }) {
  const map: Record<string, string> = {
    idle: 'bg-mist text-steel',
    live: 'bg-brand-red text-paper',
    paused: 'bg-mist text-steel',
    done: 'bg-ink text-paper',
  }
  const label = status === 'done' && winnerSide ? `Winner ${winnerSide.toUpperCase()}` : status
  return <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${map[status] ?? 'bg-mist text-steel'}`}>{label}</span>
}
