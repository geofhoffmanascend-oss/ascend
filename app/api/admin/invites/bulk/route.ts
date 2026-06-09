import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { generateInviteToken, normalizeBelt } from '@/lib/invites'
import type { Belt } from '@prisma/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Row = { email?: string; name?: string; belt?: string; phone?: string; instructor?: boolean; notes?: string }
type RowResult = { email: string; status: 'invited' | 'associated' | 'already_member' | 'already_invited' | 'invalid'; instructor: boolean }

// POST /api/admin/invites/bulk — Phase 40.2. Gym admin imports a member list.
// Existing accounts are associated immediately; new emails get a targeted invite
// that auto-applies when they sign up. Instructor-flagged rows never auto-grant —
// they request approval (40.4).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.roles?.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const body = (await req.json().catch(() => ({}))) as { rows?: Row[] }
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 1000) : []
  if (rows.length === 0) return NextResponse.json({ error: 'No rows to import.' }, { status: 400 })

  const adminId = session.user.id
  const results: RowResult[] = []
  const seen = new Set<string>()

  for (const r of rows) {
    const email = (r.email ?? '').trim().toLowerCase()
    const instructor = !!r.instructor
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) {
      if (email && !seen.has(email)) results.push({ email, status: 'invalid', instructor })
      continue
    }
    seen.add(email)

    const meta = {
      name: r.name?.trim() || undefined,
      belt: normalizeBelt(r.belt) || undefined,
      phone: r.phone?.trim() || undefined,
      notes: r.notes?.trim() || undefined,
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, gymId: true, roles: true, name: true, belt: true, phone: true },
    })

    if (existingUser) {
      const activeMembership = await prisma.gymMembership.findUnique({
        where: { userId_gymId: { userId: existingUser.id, gymId } },
        select: { status: true },
      })
      if (activeMembership?.status === 'active' && !instructor) {
        results.push({ email, status: 'already_member', instructor })
        continue
      }
      // Associate now.
      await prisma.gymMembership.upsert({
        where: { userId_gymId: { userId: existingUser.id, gymId } },
        update: { status: 'active' },
        create: { userId: existingUser.id, gymId, status: 'active' },
      })
      await prisma.user.updateMany({ where: { id: existingUser.id, gymId: null }, data: { gymId } })
      // Prefill empty fields.
      const data: { name?: string; belt?: Belt; phone?: string } = {}
      if (!existingUser.name && meta.name) data.name = meta.name
      if (!existingUser.phone && meta.phone) data.phone = meta.phone
      if (meta.belt && existingUser.belt === 'white') data.belt = meta.belt
      if (Object.keys(data).length) await prisma.user.update({ where: { id: existingUser.id }, data })
      // Instructor → request approval (never auto-grant via bulk).
      if (instructor && !(existingUser.roles ?? []).includes('instructor')) {
        await prisma.user.update({ where: { id: existingUser.id }, data: { instructorRequestedAt: new Date() } })
      }
      // Mutual follow the importing admin.
      if (existingUser.id !== adminId) {
        for (const [a, b] of [[adminId, existingUser.id], [existingUser.id, adminId]]) {
          await prisma.follow.upsert({
            where: { followerId_followingId: { followerId: a, followingId: b } },
            update: {}, create: { followerId: a, followingId: b },
          }).catch(() => {})
        }
      }
      results.push({ email, status: activeMembership ? 'already_member' : 'associated', instructor })
      continue
    }

    // No account yet — create or reuse a targeted invite.
    const existingInvite = await prisma.invitation.findFirst({
      where: { gymId, email: { equals: email, mode: 'insensitive' }, usedCount: 0 },
      select: { id: true },
    })
    if (existingInvite) {
      results.push({ email, status: 'already_invited', instructor })
      continue
    }
    await prisma.invitation.create({
      data: {
        token: generateInviteToken(),
        inviterId: adminId,
        kind: instructor ? 'gym_instructor' : 'gym_member',
        gymId,
        grantOnAccept: false, // instructor = approve-after (40.4); members just join
        maxUses: 1,
        email,
        meta,
      },
    })
    results.push({ email, status: 'invited', instructor })
  }

  const summary = {
    invited: results.filter(r => r.status === 'invited').length,
    associated: results.filter(r => r.status === 'associated').length,
    alreadyMember: results.filter(r => r.status === 'already_member').length,
    alreadyInvited: results.filter(r => r.status === 'already_invited').length,
    invalid: results.filter(r => r.status === 'invalid').length,
    instructorRequests: results.filter(r => r.instructor && r.status !== 'invalid').length,
  }
  return NextResponse.json({ summary, results })
}
