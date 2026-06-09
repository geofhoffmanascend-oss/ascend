import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { canApproveProviders } from '@/lib/provider'
import { createNotification } from '@/lib/notify'

// PATCH /api/provider/applications/[id] — approve/reject an independent-provider
// application. Verified black belts + site admins only.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { belt: true, beltVerified: true, roles: true },
  })
  if (!me || !canApproveProviders(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { action } = (await req.json().catch(() => ({}))) as { action?: 'approve' | 'reject' }
  if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const applicant = await prisma.user.findUnique({ where: { id }, select: { providerStatus: true } })
  if (!applicant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (applicant.providerStatus !== 'pending') return NextResponse.json({ error: 'This application is not pending.' }, { status: 409 })

  if (action === 'approve') {
    await prisma.user.update({
      where: { id },
      data: { providerStatus: 'approved', providerApprovedById: session.user.id, providerApprovedAt: new Date() },
    })
    await createNotification(id, 'general', 'You can now offer private lessons', {
      body: 'Your independent provider application was approved. Set your availability to start receiving requests.',
      link: '/provider/availability',
    }).catch(() => {})
    return NextResponse.json({ status: 'approved' })
  }

  await prisma.user.update({ where: { id }, data: { providerStatus: 'rejected', providerApprovedById: session.user.id, providerApprovedAt: new Date() } })
  await createNotification(id, 'general', 'Provider application not approved', {
    body: 'Your independent provider application was not approved at this time.',
    link: '/provider',
  }).catch(() => {})
  return NextResponse.json({ status: 'rejected' })
}
