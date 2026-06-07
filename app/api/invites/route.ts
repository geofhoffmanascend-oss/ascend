import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { generateInviteToken } from '@/lib/invites'

// GET /api/invites — the current user's reusable personal (friend) invite link.
// Find-or-create: one permanent friend invite per user.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let invite = await prisma.invitation.findFirst({
    where: { inviterId: session.user.id, kind: 'friend' },
    select: { token: true },
  })
  if (!invite) {
    invite = await prisma.invitation.create({
      data: { token: generateInviteToken(), inviterId: session.user.id, kind: 'friend', maxUses: null },
      select: { token: true },
    })
  }
  return NextResponse.json({ token: invite.token, path: `/invite/${invite.token}` })
}

// POST /api/invites — create a gym invite (admin only). Body:
//   { kind: 'gym_instructor' | 'gym_member', grantOnAccept?: boolean }
// gym_instructor + grantOnAccept=true  → single-use link, grants instructor on accept
// gym_instructor + grantOnAccept=false → reusable, sets a pending instructor request
// gym_member → reusable, auto-joins active membership
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.roles?.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const body = await req.json()
  const kind = body.kind === 'gym_member' ? 'gym_member' : 'gym_instructor'
  const grantOnAccept = kind === 'gym_instructor' ? body.grantOnAccept !== false : true
  const maxUses = kind === 'gym_instructor' && grantOnAccept ? 1 : null // single-use instructor link

  const invite = await prisma.invitation.create({
    data: { token: generateInviteToken(), inviterId: session.user.id, kind, gymId, grantOnAccept, maxUses },
    select: { token: true },
  })
  return NextResponse.json({ token: invite.token, path: `/invite/${invite.token}`, kind, grantOnAccept })
}
