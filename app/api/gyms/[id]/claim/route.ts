import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// POST /api/gyms/[id]/claim — Phase 39.1. An owner requests to claim an
// unclaimed gym listing. Creates a pending claim for site-admin verification.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { note } = (await req.json().catch(() => ({}))) as { note?: string }

  const gym = await prisma.gym.findUnique({
    where: { id },
    select: { id: true, name: true, users: { where: { roles: { has: 'admin' } }, select: { id: true }, take: 1 } },
  })
  if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

  // Already claimed?
  if (gym.users.length > 0) {
    return NextResponse.json({ error: 'This gym is already managed by an owner.' }, { status: 409 })
  }

  // The claimant can't already administer another gym (one gym per owner).
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gymId: true, roles: true, name: true } })
  if (me?.gymId && (me.roles ?? []).includes('admin') && me.gymId !== id) {
    return NextResponse.json({ error: 'You already administer a gym. Managing multiple gyms is not yet supported.' }, { status: 409 })
  }

  // No duplicate pending claim by this user for this gym.
  const existing = await prisma.gymClaim.findFirst({
    where: { gymId: id, userId: session.user.id, status: 'pending' },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have a pending claim for this gym.' }, { status: 409 })
  }

  const claim = await prisma.gymClaim.create({
    data: { gymId: id, userId: session.user.id, note: note?.trim() || null, status: 'pending' },
    select: { id: true },
  })

  // Notify site admins.
  try {
    const siteAdmins = await prisma.user.findMany({ where: { roles: { has: 'site_admin' } }, select: { id: true } })
    await Promise.all(
      siteAdmins.map(a =>
        createNotification(a.id, 'general', 'Gym claim submitted', {
          body: `${me?.name ?? 'Someone'} wants to claim "${gym.name}".`,
          link: '/site-admin/claims',
        }),
      ),
    )
  } catch (e) {
    console.error('[api/gyms/[id]/claim] notify', e)
  }

  return NextResponse.json({ id: claim.id, status: 'pending' }, { status: 201 })
}
