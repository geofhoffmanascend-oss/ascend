import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const { status, rejectionNote } = await req.json()

  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
  }

  const event = await prisma.publicEvent.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.publicEvent.update({
    where: { id },
    data: {
      status,
      approvedById: session!.user.id,
      rejectionNote: status === 'rejected' ? (rejectionNote?.trim() || null) : null,
    },
  })

  const isApproved = status === 'approved'
  await createNotification(
    event.submittedById,
    'general',
    `Your event "${event.title}" has been ${isApproved ? 'approved' : 'rejected'}`,
    {
      body: isApproved
        ? 'It is now visible on the public events calendar.'
        : (rejectionNote?.trim() || 'No reason provided.'),
      link: `/events/${id}`,
    }
  )

  return NextResponse.json({ event: updated })
}

// PATCH — edit an event's fields (site admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const event = await prisma.publicEvent.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const b = await req.json()

  const data: Record<string, unknown> = {}
  if (typeof b.title === 'string') {
    if (!b.title.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    data.title = b.title.trim()
  }
  if (b.type && ['open_mat', 'competition', 'seminar', 'other'].includes(b.type)) data.type = b.type
  if ('description' in b) data.description = b.description?.trim() || null
  if ('location' in b) data.location = b.location?.trim() || null
  if ('address' in b) data.address = b.address?.trim() || null
  if ('city' in b) data.city = b.city?.trim() || null
  if ('state' in b) data.state = b.state?.trim() || null
  if ('zip' in b) data.zip = b.zip?.trim() || null

  if (b.startDate) {
    const start = new Date(b.startDate)
    if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
    data.startDate = start
  }
  if ('endDate' in b) {
    if (!b.endDate) {
      data.endDate = null
    } else {
      const end = new Date(b.endDate)
      if (isNaN(end.getTime())) return NextResponse.json({ error: 'Invalid end date' }, { status: 400 })
      data.endDate = end
    }
  }

  const updated = await prisma.publicEvent.update({ where: { id }, data })
  return NextResponse.json({ event: updated })
}

// DELETE — remove an event (site admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const event = await prisma.publicEvent.findUnique({ where: { id }, select: { id: true } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.publicEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
