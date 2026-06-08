import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// GET /api/gyms — list gyms (public, paginated)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const skip = (page - 1) * limit

  try {
    const [gyms, total] = await Promise.all([
      prisma.gym.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
          headInstructorName: true,
          participatingStatus: true,
          createdAt: true,
        },
      }),
      prisma.gym.count(),
    ])

    return NextResponse.json({ gyms, total, page, limit })
  } catch (err) {
    console.error('[api/gyms GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateBaseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'gym'
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let i = 2
  while (await prisma.gym.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`
  }
  return slug
}

// POST /api/gyms — create gym (authenticated)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    name, address, city, state, zip, phone, website,
    logoUrl, headInstructorName, description,
    asOwner, // Phase 38 — owner context: instantly grant admin + instructor
  } = body

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Phase 38.2 / §8 — owner-context guard: an owner administers exactly one gym
  // (admin role + gymId). Block creating a second one in owner context so we
  // don't orphan their existing gym by moving gymId.
  if (asOwner === true) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gymId: true, roles: true },
    })
    if (me?.gymId && (me.roles ?? []).includes('admin')) {
      return NextResponse.json(
        { error: 'You already administer a gym. Managing multiple gyms is not yet supported.' },
        { status: 409 },
      )
    }
  }

  const slug = await uniqueSlug(generateBaseSlug(name))

  try {
    const gym = await prisma.gym.create({
      data: {
        name,
        slug,
        address: address ?? null,
        city: city ?? null,
        state: state ?? null,
        zip: zip ?? null,
        phone: phone ?? null,
        website: website ?? null,
        logoUrl: logoUrl ?? null,
        headInstructorName: headInstructorName ?? null,
        description: description ?? null,
        participatingStatus: 'free',
        members: {
          create: {
            userId: session.user.id,
            status: 'active',
          },
        },
        // Every gym gets a general (non-class-group) community forum.
        forums: {
          create: {
            type: 'gym_forum',
            title: 'General',
          },
        },
      },
    })

    // Geocode the address for map/radius features (best-effort; never blocks creation).
    if (address || city || zip) {
      try {
        const { geocodeParts } = await import('@/lib/geocode')
        const coords = await geocodeParts({ address, city, state, zip })
        if (coords) await prisma.gym.update({ where: { id: gym.id }, data: { lat: coords.lat, lng: coords.lng } })
      } catch (e) { console.error('[api/gyms POST] geocode', e) }
    }

    if (asOwner === true) {
      // Owner context (Phase 38, D-AUTH): instantly grant admin + instructor and
      // point gymId at the new gym in the same write. Instant grant, no
      // verification gate — testing only; revisit before public launch (§8).
      // NEVER reached from the student "Add my gym" path (no asOwner flag).
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      })
      const roles = me?.roles ?? []
      const nextRoles = Array.from(new Set([...roles, 'admin', 'instructor'])) as typeof roles
      await prisma.user.update({
        where: { id: session.user.id },
        data: { roles: nextRoles, gymId: gym.id },
      })
    } else {
      // Student "Add my gym" path: member only. Set gymId only if unset.
      await prisma.user.updateMany({
        where: { id: session.user.id, gymId: null },
        data: { gymId: gym.id },
      })
    }

    // Notify all site_admin users
    try {
      const siteAdmins = await prisma.user.findMany({
        where: { roles: { has: 'site_admin' } },
        select: { id: true },
      })
      if (siteAdmins.length > 0) {
        await prisma.notification.createMany({
          data: siteAdmins.map(admin => ({
            userId: admin.id,
            type: 'general' as const,
            title: 'New gym registered',
            body: `"${gym.name}" has been created and is awaiting review.`,
            link: `/site-admin/gyms/${gym.id}`,
          })),
        })
      }
    } catch (notifErr) {
      console.error('[api/gyms POST] notification error:', notifErr)
    }

    return NextResponse.json({ gym }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A gym with that slug already exists' }, { status: 409 })
    }
    console.error('[api/gyms POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
