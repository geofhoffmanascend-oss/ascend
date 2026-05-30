import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BracketView, type BracketMatch, type BracketParticipant } from '@/app/components/BracketView'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const t = await prisma.tournament.findUnique({ where: { id }, select: { title: true } })
  return { title: `${t?.title ?? 'Tournament'} — Results` }
}

export default async function TournamentResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const gymId = session?.user?.gymId ?? null
  const isSiteAdmin = session?.user?.roles?.includes('site_admin')

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      gym: { select: { name: true } },
      divisions: {
        include: {
          registrations: {
            include: { user: { select: { id: true, name: true, belt: true } } },
            orderBy: { seed: 'asc' },
          },
          matches: { orderBy: [{ round: 'asc' }, { position: 'asc' }] },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!tournament) notFound()

  const isMember = tournament.gymId === gymId
  if (!tournament.isPublic && !isMember && !isSiteAdmin) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href={`/tournaments/${id}`} className="text-xs text-ash hover:text-ink transition-colors">← Tournament</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Results</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{tournament.title}</h1>
        <p suppressHydrationWarning className="text-sm text-ash mt-1">
          {new Date(tournament.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {tournament.gym && ` · ${tournament.gym.name}`}
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {tournament.divisions.map(div => {
          const participants: BracketParticipant[] = div.registrations.map(r => ({
            id: r.user.id,
            name: r.user.name,
            belt: r.user.belt,
          }))

          return (
            <div key={div.id}>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">{div.name}</p>
              {div.matches.length === 0 ? (
                <p className="text-sm text-ash italic">No bracket generated yet.</p>
              ) : (
                <BracketView
                  matches={div.matches as BracketMatch[]}
                  participants={participants}
                  format={tournament.format as 'single_elim' | 'round_robin' | 'double_elim'}
                  isAdmin={false}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
