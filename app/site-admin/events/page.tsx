import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'
import prisma from '@/lib/database'
import { EventApprovalClient } from './EventApprovalClient'

export const metadata = { title: 'Event Queue — Site Admin' }

export default async function SiteAdminEventsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  const pending = await prisma.publicEvent.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    include: { submittedBy: { select: { name: true, email: true } }, gym: { select: { name: true } } },
  })

  const serialized = pending.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/site-admin" className="text-xs text-ash hover:text-ink transition-colors">← Site Admin</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Event Queue</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Pending Events</h1>
        <p className="text-sm text-ash mt-1">{pending.length} event{pending.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      <EventApprovalClient events={serialized} />
    </div>
  )
}
