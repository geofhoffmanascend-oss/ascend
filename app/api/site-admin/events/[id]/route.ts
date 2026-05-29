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
