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
    select: { id: true, name: true, belt: true, beltVerified: true, avatarUrl: true, gymId: true },
  })

  const gymResults = instructors.map(i => {
    const g = gymMap.get(i.gymId!)!
    return { id: i.id, name: i.name, belt: i.belt, beltVerified: i.beltVerified, avatarUrl: i.avatarUrl, kind: 'class' as const, gymName: g.name, gymSlug: g.slug as string | null, miles: Math.round(g.dist) }
  })

  // Phase 42.4 — approved independent (private) instructors within radius (own coords, no gym).
  const providers = await prisma.user.findMany({
    where: {
      providerStatus: 'approved',
      providerLat: { not: null },
      providerLng: { not: null },
      id: { not: session.user.id },
    },
    select: { id: true, name: true, belt: true, beltVerified: true, avatarUrl: true, providerLat: true, providerLng: true },
  })
  const providerResults = providers
    .map(p => ({ p, dist: distanceMiles(origin, { lat: p.providerLat!, lng: p.providerLng! }) }))
    .filter(x => x.dist <= miles)
    .map(({ p, dist }) => ({ id: p.id, name: p.name, belt: p.belt, beltVerified: p.beltVerified, avatarUrl: p.avatarUrl, kind: 'private' as const, gymName: 'Independent' as string, gymSlug: null as string | null, miles: Math.round(dist) }))

  // De-dupe (a gym instructor who is also an approved provider) — keep the gym row.
  const seen = new Set(gymResults.map(r => r.id))
  const results = [...gymResults, ...providerResults.filter(r => !seen.has(r.id))].sort((a, b) => a.miles - b.miles)

  return NextResponse.json({ results })
}
