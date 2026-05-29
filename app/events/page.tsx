import type { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/database'
import { EventsClient } from './EventsClient'

export const metadata: Metadata = {
  title: 'Community Events',
  description: 'Open mats, competitions, and seminars in the jiu-jitsu community.',
}

export default async function EventsPage() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const events = await prisma.publicEvent.findMany({
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
  })

  const serialized = events.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
  }))

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
        <Link
          href="/events/new"
          className="flex-shrink-0 px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
        >
          + Submit Event
        </Link>
      </div>

      <EventsClient events={serialized} />
    </div>
  )
}
