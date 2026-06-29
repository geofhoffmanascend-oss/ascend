import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// POST /api/events/[id]/report — logged-in users flag an event for site-admin review.
// Sends an in-app notification to every site admin (replaces the old mailto link).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const event = await prisma.publicEvent.findUnique({
    where: { id },
    select: { id: true, title: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  const reporter = session.user.name || session.user.email || 'A member'

  const siteAdmins = await prisma.user.findMany({
    where: { roles: { has: 'site_admin' } },
    select: { id: true },
  })

  await Promise.all(
    siteAdmins.map(a =>
      createNotification(a.id, 'general', `Event reported: ${event.title}`, {
        body: `${reporter} flagged this event${reason ? `: "${reason}"` : '.'}`,
        link: `/events/${event.id}`,
      })
    )
  )

  return NextResponse.json({ ok: true })
}
