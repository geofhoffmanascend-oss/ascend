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

// Public-launch pivot: a challenge advances accepted → scheduled once BOTH parties have
// signed the platform friendly-challenge waiver. No gym-admin approval step.
export async function maybeAdvanceToScheduled(challengeId: string) {
  const c = await prisma.challengeMatch.findUnique({ where: { id: challengeId } })
  if (!c || c.status !== 'accepted') return
  if (!c.challengerSignedAt || !c.challengedSignedAt) return

  await prisma.challengeMatch.update({ where: { id: challengeId }, data: { status: 'scheduled' } })
  for (const uid of [c.challengerId, c.challengedId]) {
    await createNotification(uid, 'general', 'Challenge match is on', {
      body: 'Both of you signed the waiver. Coordinate the venue (get the gym’s OK), line up a black-belt referee, and run it.',
      link: `/challenges/${challengeId}`,
    })
  }
}

// Signature state of the platform waiver for a given user on a challenge.
export function signatureStateFor(
  c: { challengerId: string; challengedId: string; challengerSignedAt: Date | null; challengedSignedAt: Date | null },
  userId: string,
) {
  const isChallenger = c.challengerId === userId
  const mySigned = isChallenger ? !!c.challengerSignedAt : !!c.challengedSignedAt
  const otherSigned = isChallenger ? !!c.challengedSignedAt : !!c.challengerSignedAt
  const bothSigned = !!c.challengerSignedAt && !!c.challengedSignedAt
  return { mySigned, otherSigned, bothSigned }
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
