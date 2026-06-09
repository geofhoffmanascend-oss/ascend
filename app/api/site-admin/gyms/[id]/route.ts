import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

// GET /api/site-admin/gyms/[id] — full gym detail with members and forum
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params

  const [gym, members, gymForum] = await Promise.all([
    prisma.gym.findUnique({ where: { id } }),
    prisma.gymMembership.findMany({
      where: { gymId: id, status: 'active' },
      include: { user: { select: { id: true, name: true, email: true, belt: true, roles: true, createdAt: true } } },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.forum.findFirst({
      where: { gymId: id, type: 'gym_forum' },
      include: { _count: { select: { posts: true, subscriptions: true } } },
    }),
  ])

  if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

  return NextResponse.json({ gym, members, gymForum })
}

// PUT /api/site-admin/gyms/[id] — update gym info/tier (site_admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const {
    name, participatingStatus, paymentTerms,
    headInstructorName, description, logoUrl,
    address, city, state, zip, phone, website,
  } = body

  try {
    const existing = await prisma.gym.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

    const gym = await prisma.gym.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(participatingStatus !== undefined && { participatingStatus }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(headInstructorName !== undefined && { headInstructorName }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
      },
    })

    // Phase 42 — re-geocode for radius search when the location changed.
    const locationChanged =
      (address !== undefined && address !== existing.address) ||
      (city !== undefined && city !== existing.city) ||
      (state !== undefined && state !== existing.state) ||
      (zip !== undefined && zip !== existing.zip)
    if (locationChanged) {
      try {
        const { geocodeParts } = await import('@/lib/geocode')
        const coords = await geocodeParts({ address: gym.address, city: gym.city, state: gym.state, zip: gym.zip })
        if (coords) await prisma.gym.update({ where: { id }, data: { lat: coords.lat, lng: coords.lng } })
      } catch (e) { console.error('[api/site-admin/gyms/[id] PUT] geocode', e) }
    }

    // Notify gym admins when tier is upgraded to participating
    if (participatingStatus === 'participating' && existing.participatingStatus !== 'participating') {
      const memberships = await prisma.gymMembership.findMany({
        where: { gymId: id, status: 'active' },
        include: { user: { select: { id: true, roles: true } } },
      })
      const adminIds = memberships
        .filter(m => m.user.roles.includes('admin'))
        .map(m => m.user.id)
      if (adminIds.length > 0) {
        const gymForum = await prisma.forum.findFirst({ where: { gymId: id, type: 'gym_forum' }, select: { id: true } })
        await prisma.notification.createMany({
          data: adminIds.map(userId => ({
            userId,
            type: 'general' as const,
            title: 'Your gym has been upgraded',
            body: gymForum
              ? `${gym.name} is now a Participating gym. Your community forum is now marked as the official gym forum.`
              : `${gym.name} is now a Participating gym on AscendIt.`,
            link: gymForum ? `/forum/${gymForum.id}` : `/gyms/${gym.slug}`,
          })),
        })
      }
    }

    return NextResponse.json({ gym })
  } catch (err) {
    console.error('[api/site-admin/gyms/[id] PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
