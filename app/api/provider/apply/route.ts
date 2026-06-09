import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// POST /api/provider/apply — Phase 42.4. Any logged-in user applies to offer
// private lessons as an independent provider. Goes to a verified-black-belt queue.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { providerStatus: true, name: true } })
  if (me?.providerStatus === 'pending') return NextResponse.json({ error: 'Your application is already pending review.' }, { status: 409 })
  if (me?.providerStatus === 'approved') return NextResponse.json({ error: 'You are already an approved provider.' }, { status: 409 })

  const { bio, city, state, zip } = (await req.json().catch(() => ({}))) as { bio?: string; city?: string; state?: string; zip?: string }

  // Geocode the provider's location for radius discovery (best-effort).
  let lat: number | null = null
  let lng: number | null = null
  if (city || zip) {
    try {
      const { geocodeParts } = await import('@/lib/geocode')
      const coords = await geocodeParts({ city, state, zip })
      if (coords) { lat = coords.lat; lng = coords.lng }
    } catch (e) { console.error('[provider/apply] geocode', e) }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      providerStatus: 'pending',
      providerBio: bio?.trim() || null,
      providerCity: city?.trim() || null,
      providerState: state?.trim() || null,
      providerLat: lat,
      providerLng: lng,
      providerApprovedById: null,
      providerApprovedAt: null,
    },
  })

  // Notify approvers (verified black belts + site admins).
  try {
    const approvers = await prisma.user.findMany({
      where: { OR: [{ AND: [{ belt: 'black' }, { beltVerified: true }] }, { roles: { has: 'site_admin' } }] },
      select: { id: true },
    })
    await Promise.all(
      approvers
        .filter(a => a.id !== session.user.id)
        .map(a => createNotification(a.id, 'general', 'New independent provider application', {
          body: `${me?.name ?? 'Someone'} applied to offer private lessons.`,
          link: '/provider/approvals',
        })),
    )
  } catch (e) { console.error('[provider/apply] notify', e) }

  return NextResponse.json({ status: 'pending' }, { status: 201 })
}
