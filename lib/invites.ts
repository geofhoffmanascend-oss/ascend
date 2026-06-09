import { randomBytes } from 'crypto'
import prisma from './database'
import type { Role, Belt } from '@prisma/client'

export function generateInviteToken(): string {
  return randomBytes(9).toString('base64url') // ~12 url-safe chars
}

const BELTS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black']
export function normalizeBelt(v: unknown): Belt | null {
  if (typeof v !== 'string') return null
  const b = v.trim().toLowerCase()
  return (BELTS as string[]).includes(b) ? (b as Belt) : null
}

export type ApplyResult =
  | { ok: true; kind: string; gymId: string | null; inviterId: string; instructorRequested: boolean }
  | { ok: false; reason: 'invalid' | 'expired' | 'maxed' | 'self' | 'already' }

// Apply an invite for a (just-registered or logged-in) user: mutual-follow the
// inviter, plus any gym membership / instructor grant the invite carries.
export async function applyInvite(token: string, userId: string): Promise<ApplyResult> {
  const inv = await prisma.invitation.findUnique({ where: { token } })
  if (!inv) return { ok: false, reason: 'invalid' }
  if (inv.expiresAt && inv.expiresAt < new Date()) return { ok: false, reason: 'expired' }
  if (inv.inviterId === userId) return { ok: false, reason: 'self' }

  const already = await prisma.inviteRedemption.findUnique({
    where: { invitationId_userId: { invitationId: inv.id, userId } },
  })
  if (already) return { ok: false, reason: 'already' }
  if (inv.maxUses != null && inv.usedCount >= inv.maxUses) return { ok: false, reason: 'maxed' }

  let instructorRequested = false

  await prisma.$transaction(async (tx) => {
    // Mutual follow
    for (const [followerId, followingId] of [[inv.inviterId, userId], [userId, inv.inviterId]]) {
      await tx.follow.upsert({
        where: { followerId_followingId: { followerId, followingId } },
        update: {},
        create: { followerId, followingId },
      })
    }

    if ((inv.kind === 'gym_member' || inv.kind === 'gym_instructor') && inv.gymId) {
      await tx.gymMembership.upsert({
        where: { userId_gymId: { userId, gymId: inv.gymId } },
        update: { status: 'active' },
        create: { userId, gymId: inv.gymId, status: 'active' },
      })
      await tx.user.updateMany({ where: { id: userId, gymId: null }, data: { gymId: inv.gymId } })
    }

    if (inv.kind === 'gym_instructor' && inv.gymId) {
      if (inv.grantOnAccept) {
        const u = await tx.user.findUnique({ where: { id: userId }, select: { roles: true } })
        const roles = Array.from(new Set([...(u?.roles ?? []), 'instructor'])) as Role[]
        await tx.user.update({ where: { id: userId }, data: { roles } })
      } else {
        await tx.user.update({ where: { id: userId }, data: { instructorRequestedAt: new Date() } })
        instructorRequested = true
      }
    }

    // Phase 40.2 — prefill from a bulk-CSV invite's meta into empty fields only.
    const meta = (inv.meta ?? null) as { name?: string; belt?: string; phone?: string } | null
    if (meta) {
      const u = await tx.user.findUnique({ where: { id: userId }, select: { name: true, belt: true, phone: true } })
      const data: { name?: string; belt?: Belt; phone?: string } = {}
      if (!u?.name && typeof meta.name === 'string' && meta.name.trim()) data.name = meta.name.trim()
      if (!u?.phone && typeof meta.phone === 'string' && meta.phone.trim()) data.phone = meta.phone.trim()
      const belt = normalizeBelt(meta.belt)
      if (belt && u?.belt === 'white') data.belt = belt // only override the default
      if (Object.keys(data).length > 0) await tx.user.update({ where: { id: userId }, data })
    }

    await tx.inviteRedemption.create({ data: { invitationId: inv.id, userId } })
    await tx.invitation.update({ where: { id: inv.id }, data: { usedCount: { increment: 1 } } })
  })

  return { ok: true, kind: inv.kind, gymId: inv.gymId, inviterId: inv.inviterId, instructorRequested }
}

// Phase 40.2 — apply any pending email-targeted (bulk CSV) invites for a
// just-registered user. Best-effort; called from the register flow.
export async function applyEmailInvites(email: string, userId: string): Promise<number> {
  const now = new Date()
  const invites = await prisma.invitation.findMany({
    where: {
      email: { equals: email, mode: 'insensitive' },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { token: true, maxUses: true, usedCount: true },
  })
  let applied = 0
  for (const inv of invites) {
    if (inv.maxUses != null && inv.usedCount >= inv.maxUses) continue
    const res = await applyInvite(inv.token, userId).catch(() => null)
    if (res?.ok) applied++
  }
  return applied
}
