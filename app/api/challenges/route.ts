import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'
import { createNotification } from '@/lib/notify'

// GET /api/challenges — the current user's challenges (incoming + outgoing).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const challenges = await prisma.challengeMatch.findMany({
    where: { OR: [{ challengerId: session.user.id }, { challengedId: session.user.id }] },
    orderBy: { updatedAt: 'desc' },
    include: {
      challenger: { select: { id: true, name: true } },
      challenged: { select: { id: true, name: true } },
      hostGym: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ challenges })
}

// POST /api/challenges — propose a challenge.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { acceptsChallenges: true, name: true } })
  if (!me?.acceptsChallenges) {
    return NextResponse.json({ error: 'Turn on "Accept challenge matches" in Settings first.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const challengedId = (body?.challengedId ?? '').toString()
  if (!challengedId || challengedId === session.user.id) {
    return NextResponse.json({ error: 'Invalid opponent' }, { status: 400 })
  }

  const opponent = await prisma.user.findUnique({ where: { id: challengedId }, select: { id: true, name: true, acceptsChallenges: true } })
  if (!opponent) return NextResponse.json({ error: 'Opponent not found' }, { status: 404 })
  if (!opponent.acceptsChallenges) return NextResponse.json({ error: 'That member is not accepting challenges' }, { status: 400 })

  // one active challenge per pair
  const active = await prisma.challengeMatch.findFirst({
    where: {
      status: { in: ['proposed', 'countered', 'accepted', 'gym_pending', 'scheduled'] },
      OR: [
        { challengerId: session.user.id, challengedId },
        { challengerId: challengedId, challengedId: session.user.id },
      ],
    },
    select: { id: true },
  })
  if (active) return NextResponse.json({ error: 'You already have an active challenge with this member', challengeId: active.id }, { status: 409 })

  const ruleset = getRuleset(body?.rulesetId)
  if (!ruleset) return NextResponse.json({ error: 'Pick a ruleset' }, { status: 400 })
  const periodMs = Number.isFinite(body?.periodMs) && body.periodMs > 0
    ? Math.min(Math.round(body.periodMs), 60 * 60_000)
    : ruleset.periodMs

  // host gym (optional, but must opt into hosting if provided)
  let hostGymId: string | null = null
  if (body?.hostGymId) {
    const gym = await prisma.gym.findUnique({
      where: { id: body.hostGymId.toString() },
      select: { id: true, hostsOpenChallenges: true, hostsInHouseChallenges: true },
    })
    if (!gym) return NextResponse.json({ error: 'Host gym not found' }, { status: 404 })
    const bothHere = session.user.gymId === gym.id && opponent && (await isMemberGym(challengedId, gym.id))
    if (!gym.hostsOpenChallenges && !(gym.hostsInHouseChallenges && bothHere)) {
      return NextResponse.json({ error: 'That gym is not hosting challenge matches' }, { status: 400 })
    }
    hostGymId = gym.id
  }

  const terms = {
    scheduledAt: body?.scheduledAt ?? null,
    location: (body?.location ?? '').toString().trim() || null,
    rulesetId: ruleset.id,
    periodMs,
    message: (body?.message ?? '').toString().trim() || null,
    stipulations: (body?.stipulations ?? '').toString().trim() || null,
  }

  const challenge = await prisma.challengeMatch.create({
    data: {
      challengerId: session.user.id,
      challengedId,
      hostGymId,
      status: 'proposed',
      scheduledAt: terms.scheduledAt ? new Date(terms.scheduledAt) : null,
      location: terms.location,
      rulesetId: ruleset.id,
      rulesetConfig: { ...ruleset, periodMs },
      periodMs,
      message: terms.message,
      stipulations: terms.stipulations,
      lastActorId: session.user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60_000),
      terms: { create: { byUserId: session.user.id, terms } },
    },
    select: { id: true },
  })

  await createNotification(challengedId, 'general', `${me.name ?? 'Someone'} challenged you to a match`, {
    body: 'Review the terms and accept, counter, or decline.',
    link: `/challenges/${challenge.id}`,
  })

  return NextResponse.json({ challenge }, { status: 201 })
}

async function isMemberGym(userId: string, gymId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { gymId: true } })
  return u?.gymId === gymId
}
