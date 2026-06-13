import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { CHALLENGE_STATUS_LABELS } from './status'

export const metadata = { title: 'Challenges' }

export default async function ChallengesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const uid = session.user.id

  const challenges = await prisma.challengeMatch.findMany({
    where: { OR: [{ challengerId: uid }, { challengedId: uid }] },
    orderBy: { updatedAt: 'desc' },
    include: {
      challenger: { select: { id: true, name: true } },
      challenged: { select: { id: true, name: true } },
      hostGym: { select: { name: true } },
    },
  })

  const active = challenges.filter(c => !['declined', 'withdrawn', 'completed', 'cancelled'].includes(c.status))
  const past = challenges.filter(c => ['declined', 'withdrawn', 'completed', 'cancelled'].includes(c.status))

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper">Challenge Matches</span>
      <h1 className="font-display text-2xl font-bold text-ink mt-3 mb-6">Your Challenges</h1>

      {challenges.length === 0 ? (
        <p className="text-sm text-slate">No challenges yet. Find a member who accepts challenges and hit <strong>Challenge</strong> on their profile.</p>
      ) : (
        <div className="space-y-6">
          <Section title="Active" rows={active} uid={uid} empty="No active challenges." />
          {past.length > 0 && <Section title="Past" rows={past} uid={uid} />}
        </div>
      )}
    </div>
  )
}

type Row = {
  id: string; status: string; updatedAt: Date
  challengerId: string; challengedId: string
  challenger: { name: string | null }; challenged: { name: string | null }
  hostGym: { name: string } | null
  winnerId: string | null
}

function Section({ title, rows, uid, empty }: { title: string; rows: Row[]; uid: string; empty?: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">{title}</p>
      {rows.length === 0 ? (
        empty ? <p className="text-sm text-ash">{empty}</p> : null
      ) : (
        <div className="space-y-2">
          {rows.map(c => {
            const opp = c.challengerId === uid ? c.challenged.name : c.challenger.name
            const iAmChallenger = c.challengerId === uid
            const resultNote = c.status === 'completed'
              ? (c.winnerId === uid ? 'You won' : c.winnerId ? 'You lost' : 'Draw')
              : null
            return (
              <Link key={c.id} href={`/challenges/${c.id}`} className="block border border-smoke bg-paper p-4 hover:border-steel transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-ink">vs {opp ?? 'Unknown'}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {iAmChallenger ? 'You challenged' : 'Challenged you'}{c.hostGym ? ` · ${c.hostGym.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-widest text-steel">{CHALLENGE_STATUS_LABELS[c.status] ?? c.status}</span>
                    {resultNote && <p className="text-xs text-brand-red font-bold mt-0.5">{resultNote}</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
