import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { TournamentDetailClient } from './TournamentDetailClient'
import { BELT_ORDER } from '@/lib/belt'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const t = await prisma.tournament.findUnique({ where: { id }, select: { title: true } })
  return { title: t?.title ?? 'Tournament' }
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const gymId = session.user.gymId ?? null
  const userId = session.user.id
  const userBelt = session.user.belt ?? 'white'

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      gym: { select: { name: true, slug: true } },
      divisions: {
        include: {
          _count: { select: { registrations: true } },
          registrations: {
            where: { userId },
            select: { id: true, confirmed: true },
          },
          matches: { orderBy: [{ round: 'asc' }, { position: 'asc' }] },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!tournament) notFound()

  const isMember = tournament.gymId === gymId
  if (!tournament.isPublic && !isMember) notFound()

  // Check gym membership for registration eligibility
  const membership = gymId ? await prisma.gymMembership.findFirst({
    where: { userId, gymId: tournament.gymId, status: 'active' },
  }) : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href="/tournaments" className="text-xs text-ash hover:text-ink transition-colors">← Tournaments</Link>
      </div>

      <TournamentDetailClient
        tournament={{
          ...tournament,
          date: tournament.date.toISOString(),
          
          
          divisions: tournament.divisions.map(d => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
            matches: d.matches.map(m => ({ ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() })),
            registrations: d.registrations,
          })),
        }}
        userId={userId}
        userBelt={userBelt}
        isMember={!!membership}
        userBeltOrder={BELT_ORDER[userBelt] ?? 0}
      />
    </div>
  )
}
