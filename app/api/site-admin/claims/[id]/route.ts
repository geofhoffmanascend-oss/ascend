import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// PATCH /api/site-admin/claims/[id] — Phase 39. Approve or reject a gym claim.
// approve → grant claimant admin+instructor + set gymId (control transfers),
// notify claimant + existing affiliated members. reject → record note + notify.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const { action, reviewNote } = (await req.json().catch(() => ({}))) as {
    action?: 'approve' | 'reject'
    reviewNote?: string
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const claim = await prisma.gymClaim.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true, gymId: true, gym: { select: { name: true, slug: true } } },
  })
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  if (claim.status !== 'pending') {
    return NextResponse.json({ error: 'This claim has already been reviewed.' }, { status: 409 })
  }

  if (action === 'reject') {
    await prisma.gymClaim.update({
      where: { id },
      data: { status: 'rejected', reviewNote: reviewNote?.trim() || null, reviewedById: session.user.id },
    })
    await createNotification(claim.userId, 'general', 'Gym claim declined', {
      body: reviewNote?.trim()
        ? `Your claim for "${claim.gym.name}" was declined: ${reviewNote.trim()}`
        : `Your claim for "${claim.gym.name}" was declined.`,
      link: '/gyms/claim',
    }).catch(() => {})
    return NextResponse.json({ status: 'rejected' })
  }

  // approve — re-check the gym is still unclaimed.
  const adminAlready = await prisma.user.findFirst({
    where: { gymId: claim.gymId, roles: { has: 'admin' } },
    select: { id: true },
  })
  if (adminAlready) {
    return NextResponse.json({ error: 'This gym already has an owner.' }, { status: 409 })
  }

  const claimant = await prisma.user.findUnique({ where: { id: claim.userId }, select: { roles: true } })
  if (!claimant) return NextResponse.json({ error: 'Claimant no longer exists.' }, { status: 404 })
  const nextRoles = Array.from(new Set([...(claimant.roles ?? []), 'admin', 'instructor'])) as typeof claimant.roles

  // Grant control + transfer membership.
  await prisma.user.update({ where: { id: claim.userId }, data: { roles: nextRoles, gymId: claim.gymId } })
  await prisma.gymMembership.upsert({
    where: { userId_gymId: { userId: claim.userId, gymId: claim.gymId } },
    update: { status: 'active' },
    create: { userId: claim.userId, gymId: claim.gymId, status: 'active' },
  })
  await prisma.gymClaim.update({
    where: { id },
    data: { status: 'approved', reviewNote: reviewNote?.trim() || null, reviewedById: session.user.id },
  })
  // Reject any other pending claims for the same gym.
  await prisma.gymClaim.updateMany({
    where: { gymId: claim.gymId, status: 'pending', NOT: { id } },
    data: { status: 'rejected', reviewNote: 'Another claim for this gym was approved.', reviewedById: session.user.id },
  })

  // Notify the new owner + existing affiliated members.
  await createNotification(claim.userId, 'general', 'Gym claim approved', {
    body: `You're now the owner of "${claim.gym.name}". Set it up from your admin dashboard.`,
    link: '/admin',
  }).catch(() => {})

  try {
    const members = await prisma.user.findMany({
      where: { gymId: claim.gymId, id: { not: claim.userId } },
      select: { id: true },
    })
    await Promise.all(
      members.map(m =>
        createNotification(m.id, 'general', 'Your gym now has an owner', {
          body: `"${claim.gym.name}" is now managed by its owner on AscendIt.`,
          link: `/gyms/${claim.gym.slug}`,
        }),
      ),
    )
  } catch (e) {
    console.error('[api/site-admin/claims] member notify', e)
  }

  return NextResponse.json({ status: 'approved' })
}
