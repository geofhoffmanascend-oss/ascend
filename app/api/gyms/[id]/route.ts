import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'

// GET /api/gyms/[id] — get a single gym by id or slug (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const gym = await prisma.gym.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    const memberCount = await prisma.gymMembership.count({
      where: { gymId: gym.id, status: 'active' },
    })

    return NextResponse.json({ gym, memberCount })
  } catch (err) {
    console.error('[api/gyms/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
