import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { geocode, distanceMiles } from '@/lib/geocode'

// GET /api/instructors/search?location=...&miles=25 — instructors at gyms within
// the radius of a location who accept requests from outside their gym.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const location = req.nextUrl.searchParams.get('location')?.trim()
  const miles = Math.min(500, Math.max(1, parseInt(req.nextUrl.searchParams.get('miles') ?? '25', 10)))
  if (!location) return NextResponse.json({ results: [] })

  const origin = await geocode(location)
  if (!origin) return NextResponse.json({ results: [], message: 'Could not find that location.' })

  const gyms = await prisma.gym.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: { id: true, name: true, slug: true, city: true, state: true, lat: true, lng: true },
  })
  const near = gyms
    .map(g => ({ ...g, dist: distanceMiles(origin, { lat: g.lat!, lng: g.lng! }) }))
    .filter(g => g.dist <= miles)
  const gymMap = new Map(near.map(g => [g.id, g]))

  const instructors = await prisma.user.findMany({
    where: {
      gymId: { in: near.map(g => g.id) },
      acceptsOutsideOrg: true,
      roles: { hasSome: ['instructor', 'admin'] },
      id: { not: session.user.id },
    },
    select: { id: true, name: true, belt: true, avatarUrl: true, gymId: true },
  })

  const results = instructors
    .map(i => {
      const g = gymMap.get(i.gymId!)!
      return { id: i.id, name: i.name, belt: i.belt, avatarUrl: i.avatarUrl, gymName: g.name, gymSlug: g.slug, miles: Math.round(g.dist) }
    })
    .sort((a, b) => a.miles - b.miles)

  return NextResponse.json({ results })
}
