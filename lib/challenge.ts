// Phase 59 — challenge-match helpers: whose-turn logic, result propagation, and
// a member's combined competition record. Mirrors lib/tournamentResult.ts.

import prisma from './database'
import { createNotification } from './notify'

export type ChallengeLite = {
  id: string
  challengerId: string
  challengedId: string
  status: string
  lastActorId: string | null
  expiresAt: Date | null
}

// The other participant of a challenge relative to `userId` (or null if not a party).
export function otherParty(c: ChallengeLite, userId: string): string | null {
  if (c.challengerId === userId) return c.challengedId
  if (c.challengedId === userId) return c.challengerId
  return null
}

export function isParty(c: ChallengeLite, userId: string): boolean {
  return c.challengerId === userId || c.challengedId === userId
}

// Is the offer still open for negotiation?
export function isOpen(status: string): boolean {
  return status === 'proposed' || status === 'countered'
}

// Only the side that did NOT make the current offer may accept or counter it.
export function canRespond(c: ChallengeLite, userId: string): boolean {
  return isOpen(c.status) && isParty(c, userId) && c.lastActorId !== userId
}

// Whoever made the current offer can withdraw it; either side can cancel later stages.
export function canWithdraw(c: ChallengeLite, userId: string): boolean {
  return isOpen(c.status) && isParty(c, userId) && c.lastActorId === userId
}

export function isExpired(c: { expiresAt: Date | null; status: string }): boolean {
  return isOpen(c.status) && !!c.expiresAt && c.expiresAt.getTime() < Date.now()
}

// Write a result to a completed challenge + notify both. Used by the console Finish.
export async function applyChallengeResult(opts: {
  challengeId: string
  winnerId: string | null // null = draw
  winBy?: string | null
}) {
  const { challengeId, winnerId, winBy } = opts
  const c = await prisma.challengeMatch.findUnique({ where: { id: challengeId } })
  if (!c) return null

  const updated = await prisma.challengeMatch.update({
    where: { id: challengeId },
    data: { status: 'completed', winnerId, winBy: winBy ?? (winnerId ? 'decision' : 'draw') },
  })

  const result = winnerId
    ? (winnerId === c.challengerId ? 'challenger won' : 'challenged won')
    : 'a draw'
  for (const uid of [c.challengerId, c.challengedId]) {
    await createNotification(uid, 'general', 'Challenge match complete', {
      body: `Your challenge match finished — ${result}${winBy ? ` by ${winBy}` : ''}.`,
      link: `/challenges/${challengeId}`,
    })
  }
  return updated
}

// Advance accepted → gym_pending when there is nothing left to sign (no host gym,
// the host gym has no active visitor_challenge waiver, or both parties have signed).
export async function maybeAdvanceToGymPending(challengeId: string) {
  const c = await prisma.challengeMatch.findUnique({ where: { id: challengeId } })
  if (!c || c.status !== 'accepted') return

  if (!c.hostGymId) {
    await prisma.challengeMatch.update({ where: { id: challengeId }, data: { status: 'gym_pending' } })
    return
  }
  const waiver = await prisma.gymWaiver.findFirst({
    where: { gymId: c.hostGymId, kind: 'visitor_challenge', active: true },
    orderBy: { version: 'desc' },
  })
  if (!waiver) {
    await prisma.challengeMatch.update({ where: { id: challengeId }, data: { status: 'gym_pending' } })
    return
  }
  const ctx = `challenge:${challengeId}`
  const signed = await prisma.waiverSignature.count({
    where: { waiverId: waiver.id, context: ctx, userId: { in: [c.challengerId, c.challengedId] } },
  })
  if (signed >= 2) {
    await prisma.challengeMatch.update({ where: { id: challengeId }, data: { status: 'gym_pending' } })
    const admins = await prisma.user.findMany({ where: { gymId: c.hostGymId, roles: { has: 'admin' } }, select: { id: true } })
    for (const a of admins) await createNotification(a.id, 'general', 'Challenge ready for your approval', { link: `/challenges/${challengeId}` })
  }
}

// Returns the host gym's active visitor_challenge waiver + whether `userId` signed it for this challenge.
export async function waiverStateFor(challengeId: string, hostGymId: string | null, userId: string) {
  if (!hostGymId) return { waiver: null, signed: false }
  const waiver = await prisma.gymWaiver.findFirst({
    where: { gymId: hostGymId, kind: 'visitor_challenge', active: true },
    orderBy: { version: 'desc' },
  })
  if (!waiver) return { waiver: null, signed: false }
  const sig = await prisma.waiverSignature.findFirst({
    where: { waiverId: waiver.id, userId, context: `challenge:${challengeId}` },
    select: { id: true },
  })
  return { waiver, signed: !!sig }
}

// A member's combined competition record (challenges; tournament placements can fold in later).
export async function getCompetitionRecord(userId: string): Promise<{ wins: number; losses: number; draws: number }> {
  const matches = await prisma.challengeMatch.findMany({
    where: { status: 'completed', OR: [{ challengerId: userId }, { challengedId: userId }] },
    select: { winnerId: true, challengerId: true, challengedId: true },
  })
  let wins = 0, losses = 0, draws = 0
  for (const m of matches) {
    if (!m.winnerId) draws++
    else if (m.winnerId === userId) wins++
    else losses++
  }
  return { wins, losses, draws }
}
