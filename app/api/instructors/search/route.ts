import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { geocode, geocodeParts, distanceMiles } from '@/lib/geocode'

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
    select: { id: true, name: true, belt: true, beltVerified: true, avatarUrl: true, gymId: true, ratingAvg: true, ratingCount: true },
  })

  const gymResults = instructors.map(i => {
    const g = gymMap.get(i.gymId!)!
    return { id: i.id, name: i.name, belt: i.belt, beltVerified: i.beltVerified, avatarUrl: i.avatarUrl, kind: 'class' as const, gymName: g.name, gymSlug: g.slug as string | null, miles: Math.round(g.dist), ratingAvg: i.ratingAvg, ratingCount: i.ratingCount }
  })

  // Approved private instructors within radius (their own coords, no gym required).
  const providers = await prisma.user.findMany({
    where: {
      providerStatus: 'approved',
      id: { not: session.user.id },
    },
    select: { id: true, name: true, belt: true, beltVerified: true, avatarUrl: true, providerCity: true, providerState: true, providerLat: true, providerLng: true, ratingAvg: true, ratingCount: true },
  })

  // Self-heal: backfill coords for any approved provider that has a location but never
  // geocoded (e.g. applied before a geocoder was available). Persist so it's a one-time cost.
  for (const p of providers) {
    if ((p.providerLat == null || p.providerLng == null) && (p.providerCity || p.providerState)) {
      const coords = await geocodeParts({ city: p.providerCity, state: p.providerState })
      if (coords) {
        p.providerLat = coords.lat
        p.providerLng = coords.lng
        await prisma.user.update({ where: { id: p.id }, data: { providerLat: coords.lat, providerLng: coords.lng } }).catch(() => {})
      }
    }
  }

  const providerResults = providers
    .filter(p => p.providerLat != null && p.providerLng != null)
    .map(p => ({ p, dist: distanceMiles(origin, { lat: p.providerLat!, lng: p.providerLng! }) }))
    .filter(x => x.dist <= miles)
    .map(({ p, dist }) => ({ id: p.id, name: p.name, belt: p.belt, beltVerified: p.beltVerified, avatarUrl: p.avatarUrl, kind: 'private' as const, gymName: 'Independent' as string, gymSlug: null as string | null, miles: Math.round(dist), ratingAvg: p.ratingAvg, ratingCount: p.ratingCount }))

  // De-dupe (a gym instructor who is also an approved provider) — keep the gym row.
  const seen = new Set(gymResults.map(r => r.id))
  const results = [...gymResults, ...providerResults.filter(r => !seen.has(r.id))].sort((a, b) => a.miles - b.miles)

  return NextResponse.json({ results })
}
