import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ReportEventButton } from './ReportEventButton'

const TYPE_LABELS: Record<string, string> = {
  open_mat: 'Open Mat',
  competition: 'Competition',
  seminar: 'Seminar',
  other: 'Other',
}

const TYPE_STYLES: Record<string, string> = {
  open_mat: 'bg-green-100 text-green-700',
  competition: 'bg-red-100 text-red-700',
  seminar: 'bg-blue-100 text-blue-700',
  other: 'bg-mist text-steel',
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.publicEvent.findUnique({ where: { id }, select: { title: true, description: true, status: true } })
  if (!event || event.status !== 'approved') return { title: 'Event', robots: { index: false } }
  return {
    title: event.title,
    description: event.description ?? undefined,
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const event = await prisma.publicEvent.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true } },
      gym: { select: { name: true, slug: true, logoUrl: true } },
    },
  })

  if (!event) notFound()

  const isSiteAdmin = session?.user?.roles?.includes('site_admin')
  const isSubmitter = session?.user?.id === event.submittedById

  if (event.status !== 'approved' && !isSiteAdmin && !isSubmitter) notFound()

  function formatDateTime(d: Date) {
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const mapsUrl = [event.address, event.city, event.state, event.zip]
    .filter(Boolean).join(', ')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-3">
        <Link href="/events" className="text-xs text-ash hover:text-ink transition-colors">← Events</Link>
      </div>

      {/* Pending banner */}
      {event.status === 'pending' && (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 mb-6 text-sm text-amber-800">
          This event is awaiting review. We&apos;ll notify you when it&apos;s approved.
        </div>
      )}
      {event.status === 'rejected' && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 mb-6 text-sm text-red-800">
          This event was not approved.{event.rejectionNote && ` Reason: ${event.rejectionNote}`}
        </div>
      )}

      <div className="border border-smoke bg-paper p-8">
        {/* Type + date */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${TYPE_STYLES[event.type]}`}>
            {TYPE_LABELS[event.type]}
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink mb-1">{event.title}</h1>

        <div className="flex flex-col gap-4 mt-5 border-t border-smoke pt-5">
          {/* Date/time */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Date &amp; Time</p>
            <p className="text-sm text-ink">{formatDateTime(event.startDate)}</p>
            {event.endDate && (
              <p className="text-sm text-ash">Ends: {formatDateTime(event.endDate)}</p>
            )}
          </div>

          {/* Location */}
          {(event.location || event.city) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Location</p>
              {event.location && <p className="text-sm text-ink">{event.location}</p>}
              {mapsUrl && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(mapsUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-red hover:underline"
                >
                  {[event.address, [event.city, event.state].filter(Boolean).join(', '), event.zip].filter(Boolean).join(', ')} →
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">About</p>
              <p className="text-sm text-ink whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Gym */}
          {event.gym && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Hosted By</p>
              <Link href={`/gyms/${event.gym.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {event.gym.logoUrl && (
                  <img src={event.gym.logoUrl} alt={event.gym.name} className="w-6 h-6 rounded object-cover" />
                )}
                <span className="text-sm text-brand-red hover:underline">{event.gym.name}</span>
              </Link>
            </div>
          )}

          {/* Submitted by */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Submitted By</p>
            <p className="text-sm text-ash">
              {event.submittedBy.name ?? 'Community member'} · {event.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <ReportEventButton eventId={event.id} isLoggedIn={!!session?.user?.id} />
    </div>
  )
}
