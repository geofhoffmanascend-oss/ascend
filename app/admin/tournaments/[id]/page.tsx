import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { TournamentManageClient } from './TournamentManageClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await prisma.tournament.findUnique({ where: { id }, select: { title: true } })
  return { title: t?.title ?? 'Tournament' }
}

export default async function AdminTournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin')) redirect('/dashboard')

  const { id } = await params
  const gymId = session.user.gymId!

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      divisions: {
        include: {
          registrations: {
            include: { user: { select: { id: true, name: true, belt: true, stripes: true } } },
            orderBy: { createdAt: 'asc' },
          },
          matches: { orderBy: [{ round: 'asc' }, { position: 'asc' }] },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!tournament || tournament.gymId !== gymId) notFound()

  // Phase 58 M2 — live-console tables linked to this tournament's bracket matches
  const tables = await prisma.matchTable.findMany({
    where: { tournamentId: id },
    select: { id: true, publicSlug: true, status: true, tournamentMatchId: true },
  })
  const tableByMatch: Record<string, { id: string; publicSlug: string; status: string }> = {}
  for (const t of tables) {
    if (t.tournamentMatchId) tableByMatch[t.tournamentMatchId] = { id: t.id, publicSlug: t.publicSlug, status: t.status }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href="/admin/tournaments" className="text-xs text-ash hover:text-ink transition-colors">← Tournaments</Link>
      </div>
      <TournamentManageClient tableByMatch={tableByMatch} tournament={{
        ...tournament,
        date: tournament.date.toISOString(),
        
        
        divisions: tournament.divisions.map(d => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          registrations: d.registrations.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
          matches: d.matches.map(m => ({ ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() })),
        })),
      }} />
    </div>
  )
}
