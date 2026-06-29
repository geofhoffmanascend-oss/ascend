import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { isParty, maybeAdvanceToScheduled } from '@/lib/challenge'
import { challengeSide, CHALLENGE_WAIVER_VERSION } from '@/lib/challengeWaiver'

// POST /api/challenges/[id]/sign — e-sign the platform friendly-challenge waiver.
// Body: { typedName, ageConfirmed }. Both parties must sign before the match schedules.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const uid = session.user.id

  const c = await prisma.challengeMatch.findUnique({ where: { id } })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isParty(c, uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (c.status !== 'accepted') return NextResponse.json({ error: 'Agree on terms before signing.' }, { status: 409 })

  const body = await req.json().catch(() => null)
  const typedName = body?.typedName?.toString().trim()
  if (!typedName) return NextResponse.json({ error: 'Type your full legal name to sign.' }, { status: 400 })
  if (body?.ageConfirmed !== true) return NextResponse.json({ error: 'You must confirm you are 18 or older.' }, { status: 400 })

  const side = challengeSide(c, uid)
  const now = new Date()
  const data =
    side === 'challenger'
      ? { challengerSignedName: typedName, challengerSignedAt: now, waiverVersion: CHALLENGE_WAIVER_VERSION }
      : { challengedSignedName: typedName, challengedSignedAt: now, waiverVersion: CHALLENGE_WAIVER_VERSION }

  await prisma.challengeMatch.update({ where: { id }, data })
  await maybeAdvanceToScheduled(id)
  return NextResponse.json({ ok: true })
}
