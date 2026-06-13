import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

// POST /api/challenges/[id]/approve — host gym admin approves a gym_pending challenge.
// Body: { scheduledAt?, location? } (admin may finalize time/place)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const c = await prisma.challengeMatch.findUnique({ where: { id } })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!c.hostGymId) return NextResponse.json({ error: 'No host gym set' }, { status: 400 })

  // must be an admin of the host gym (or site_admin)
  const roles = session.user.roles ?? []
  const isHostAdmin = roles.includes('admin') && session.user.gymId === c.hostGymId
  if (!isHostAdmin && !roles.includes('site_admin')) {
    return NextResponse.json({ error: 'Only the host gym admin can approve' }, { status: 403 })
  }
  if (c.status !== 'gym_pending') return NextResponse.json({ error: 'Challenge is not awaiting approval' }, { status: 409 })

  const body = await req.json().catch(() => ({}))
  await prisma.challengeMatch.update({
    where: { id },
    data: {
      status: 'scheduled',
      ...(body?.scheduledAt ? { scheduledAt: new Date(body.scheduledAt) } : {}),
      ...(body?.location !== undefined ? { location: (body.location ?? '').toString().trim() || null } : {}),
    },
  })

  for (const uid of [c.challengerId, c.challengedId]) {
    await createNotification(uid, 'general', 'Challenge match scheduled', {
      body: 'The host gym approved your challenge. It can now be run on the live console.',
      link: `/challenges/${id}`,
    })
  }
  return NextResponse.json({ ok: true })
}
