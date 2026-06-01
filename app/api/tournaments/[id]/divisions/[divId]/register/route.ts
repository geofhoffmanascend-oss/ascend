import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { BELT_ORDER } from '@/lib/belt'
import { getEffectiveFeatures } from '@/lib/features'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; divId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tournaments } = await getEffectiveFeatures(session)
  if (!tournaments) return NextResponse.json({ error: 'Tournaments are not available for your gym.' }, { status: 403 })

  const { id: tournamentId, divId } = await params

  const [tournament, division, membership, user] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: tournamentId }, select: { status: true, gymId: true } }),
    prisma.division.findUnique({ where: { id: divId }, select: { beltMin: true, beltMax: true, tournamentId: true } }),
    prisma.gymMembership.findFirst({
      where: { userId: session.user.id, status: 'active' },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { belt: true } }),
  ])

  if (!tournament || !division) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (division.tournamentId !== tournamentId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tournament.status !== 'open') return NextResponse.json({ error: 'Registration is not open' }, { status: 400 })
  if (!membership || membership.gymId !== tournament.gymId) {
    return NextResponse.json({ error: 'You must be an active member of this gym to register' }, { status: 403 })
  }

  // Belt eligibility check
  if (user) {
    const userOrder = BELT_ORDER[user.belt] ?? 0
    const minOrder = BELT_ORDER[division.beltMin] ?? 0
    const maxOrder = BELT_ORDER[division.beltMax] ?? 4
    if (userOrder < minOrder || userOrder > maxOrder) {
      return NextResponse.json({ error: 'Your belt level does not meet the requirements for this division' }, { status: 400 })
    }
  }

  const registration = await prisma.registration.upsert({
    where: { divisionId_userId: { divisionId: divId, userId: session.user.id } },
    create: { divisionId: divId, userId: session.user.id },
    update: {},
  })

  return NextResponse.json({ registration }, { status: 201 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; divId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: tournamentId, divId } = await params

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { status: true } })
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tournament.status !== 'open') return NextResponse.json({ error: 'Withdrawals are not allowed after registration closes' }, { status: 400 })

  await prisma.registration.deleteMany({
    where: { divisionId: divId, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
