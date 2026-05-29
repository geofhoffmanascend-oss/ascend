import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// GET /api/gyms/[id]/members — list gym members (admin sees all; member sees active only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: gymId } = await params

  try {
    const gym = await prisma.gym.findFirst({ where: { OR: [{ id: gymId }, { slug: gymId }] } })
    if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

    const isAdmin = session.user.roles?.includes('admin')

    const memberships = await prisma.gymMembership.findMany({
      where: {
        gymId: gym.id,
        ...(isAdmin ? {} : { status: 'active' }),
      },
      include: {
        user: {
          select: { id: true, name: true, belt: true, roles: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    const members = memberships.map(m => ({
      id: m.user.id,
      name: m.user.name,
      belt: m.user.belt,
      roles: m.user.roles,
      status: m.status,
      joinedAt: m.joinedAt,
    }))

    return NextResponse.json({ members })
  } catch (err) {
    console.error('[api/gyms/[id]/members GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
