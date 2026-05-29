import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// DELETE /api/gyms/[id]/membership — leave a gym (authenticated)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: gymId } = await params

  try {
    const membershipCount = await prisma.gymMembership.count({
      where: { userId: session.user.id },
    })
    if (membershipCount <= 1) {
      return NextResponse.json({ error: 'Cannot leave your only gym' }, { status: 400 })
    }

    await prisma.gymMembership.delete({
      where: { userId_gymId: { userId: session.user.id, gymId } },
    })

    // Clear User.gymId if it pointed to this gym
    await prisma.user.updateMany({
      where: { id: session.user.id, gymId },
      data: { gymId: null },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/gyms/[id]/membership DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/gyms/[id]/membership — join a gym (authenticated)
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: gymId } = await params

  try {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } })
    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Status: active for free-tier gyms, pending for participating gyms
    const membershipStatus = gym.participatingStatus === 'free' ? 'active' : 'pending'

    const membership = await prisma.gymMembership.upsert({
      where: { userId_gymId: { userId: session.user.id, gymId } },
      update: {},
      create: {
        userId: session.user.id,
        gymId,
        status: membershipStatus,
      },
    })

    // Set gymId on the user if they don't already have a home gym
    await prisma.user.updateMany({
      where: { id: session.user.id, gymId: null },
      data: { gymId },
    })

    return NextResponse.json({ membership })
  } catch (err) {
    console.error('[api/gyms/[id]/membership PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
