import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { getEffectiveFeatures } from '@/lib/features'
import { EventsClient } from './EventsClient'

export const metadata: Metadata = {
  title: 'Community Events',
  description: 'Open mats, competitions, and seminars in the jiu-jitsu community.',
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions)
  // Event submission is platform-gated (allowEventSubmission). The calendar itself
  // stays public; only the submit affordance is hidden when submission is off.
  const canSubmit = session ? (await getEffectiveFeatures(session)).events : true

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [events, tournaments] = await Promise.all([
    prisma.publicEvent.findMany({
      where: { status: 'approved', startDate: { gte: startOfToday } },
      orderBy: { startDate: 'asc' },
      take: 50,
      select: {
        id: true,
        title: true,
        type: true,
        location: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
        gym: { select: { name: true, slug: true, logoUrl: true } },
      },
    }),
    // 32.8 — surface public in-app tournaments on the calendar
    prisma.tournament.findMany({
      where: { isPublic: true, status: { not: 'draft' }, date: { gte: startOfToday } },
      orderBy: { date: 'asc' },
      take: 50,
      select: {
        id: true,
        title: true,
        date: true,
        gym: { select: { name: true, slug: true, logoUrl: true } },
      },
    }),
  ])

  const serialized = [
    ...events.map(e => ({
      id: e.id,
      title: e.title,
      type: e.type as 'open_mat' | 'competition' | 'seminar' | 'other',
      location: e.location,
      city: e.city,
      state: e.state,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
      gym: e.gym,
      href: `/events/${e.id}`,
    })),
    ...tournaments.map(t => ({
      id: t.id,
      title: t.title,
      type: 'tournament' as const,
      location: null,
      city: null,
      state: null,
      startDate: t.date.toISOString(),
      endDate: null,
      gym: t.gym,
      href: `/tournaments/${t.id}/results`,
    })),
  ].sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Events</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Community Events</h1>
          <p className="text-sm text-ash mt-1">Open mats, competitions, and seminars near you.</p>
        </div>
        {canSubmit && (
          <Link
            href="/events/new"
            className="flex-shrink-0 px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
          >
            + Submit Event
          </Link>
        )}
      </div>

      <EventsClient events={serialized} />
    </div>
  )
}
