import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// PUT /api/gyms/[id]/members/[userId] — approve or deny a pending membership (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!session.user.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: gymId, userId } = await params
  const body = await req.json()
  const { status } = body

  if (status !== 'active' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be active or rejected' }, { status: 400 })
  }

  try {
    const gym = await prisma.gym.findFirst({ where: { OR: [{ id: gymId }, { slug: gymId }] } })
    if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })

    if (status === 'rejected') {
      await prisma.gymMembership.delete({
        where: { userId_gymId: { userId, gymId: gym.id } },
      })
      // Clear User.gymId if it pointed to this gym
      await prisma.user.updateMany({
        where: { id: userId, gymId: gym.id },
        data: { gymId: null },
      })
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    const membership = await prisma.gymMembership.update({
      where: { userId_gymId: { userId, gymId: gym.id } },
      data: { status: 'active' },
    })

    // Set User.gymId if not already set
    await prisma.user.updateMany({
      where: { id: userId, gymId: null },
      data: { gymId: gym.id },
    })

    return NextResponse.json({ membership })
  } catch (err) {
    console.error('[api/gyms/[id]/members/[userId] PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
