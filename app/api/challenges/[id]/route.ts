import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'
import { createNotification } from '@/lib/notify'
import { canRespond, canWithdraw, isParty, otherParty } from '@/lib/challenge'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const c = await prisma.challengeMatch.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, name: true } },
      challenged: { select: { id: true, name: true } },
      hostGym: { select: { id: true, name: true } },
    },
  })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isParty(c, session.user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({ challenge: c })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const uid = session.user.id

  const c = await prisma.challengeMatch.findUnique({ where: { id } })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isParty(c, uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const action = body?.action as string
  const other = otherParty(c, uid)!

  if (action === 'decline') {
    if (!canRespond(c, uid)) return NextResponse.json({ error: 'Not your turn' }, { status: 409 })
    await prisma.challengeMatch.update({ where: { id }, data: { status: 'declined' } })
    await createNotification(other, 'general', 'Challenge declined', { link: `/challenges/${id}` })
    return NextResponse.json({ ok: true })
  }

  if (action === 'withdraw') {
    if (!canWithdraw(c, uid)) return NextResponse.json({ error: 'Cannot withdraw' }, { status: 409 })
    await prisma.challengeMatch.update({ where: { id }, data: { status: 'withdrawn' } })
    await createNotification(other, 'general', 'Challenge withdrawn', { link: `/challenges/${id}` })
    return NextResponse.json({ ok: true })
  }

  if (action === 'accept') {
    if (!canRespond(c, uid)) return NextResponse.json({ error: 'Not your turn' }, { status: 409 })
    // Terms agreed → both sign the platform friendly-challenge waiver. Clear any stale signatures.
    await prisma.challengeMatch.update({
      where: { id },
      data: {
        status: 'accepted',
        challengerSignedName: null, challengerSignedAt: null,
        challengedSignedName: null, challengedSignedAt: null,
      },
    })
    await createNotification(other, 'general', 'Challenge terms accepted', {
      body: 'Next: both competitors sign the friendly-challenge waiver to lock it in.',
      link: `/challenges/${id}`,
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'counter') {
    if (!canRespond(c, uid)) return NextResponse.json({ error: 'Not your turn' }, { status: 409 })
    const ruleset = getRuleset(body?.rulesetId ?? c.rulesetId)
    if (!ruleset) return NextResponse.json({ error: 'Pick a ruleset' }, { status: 400 })
    const periodMs = Number.isFinite(body?.periodMs) && body.periodMs > 0
      ? Math.min(Math.round(body.periodMs), 60 * 60_000)
      : (c.periodMs ?? ruleset.periodMs)
    const terms = {
      scheduledAt: body?.scheduledAt ?? null,
      location: (body?.location ?? '').toString().trim() || null,
      rulesetId: ruleset.id,
      periodMs,
      message: (body?.message ?? '').toString().trim() || null,
    }
    await prisma.challengeMatch.update({
      where: { id },
      data: {
        status: 'countered',
        lastActorId: uid,
        termsVersion: { increment: 1 },
        scheduledAt: terms.scheduledAt ? new Date(terms.scheduledAt) : null,
        location: terms.location,
        rulesetId: ruleset.id,
        rulesetConfig: { ...ruleset, periodMs },
        periodMs,
        message: terms.message,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60_000),
        terms: { create: { byUserId: uid, terms } },
      },
    })
    await createNotification(other, 'general', 'Challenge terms countered', {
      body: 'Review the new terms and accept, counter, or decline.',
      link: `/challenges/${id}`,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
