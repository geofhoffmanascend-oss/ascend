import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForUser } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'
import { GROUP_FORUM_IDS } from '@/lib/classGroups'

const VALID_GROUPS = Object.values(ClassGroup)

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, session } = await requireAdminForUser(id)
  if (error) return error

  const body = await req.json() as { blockedClassGroups?: string[]; blockedProgramIds?: string[] }

  // Phase 52.5 — gym-defined class groups (blockedProgramIds). Validate the ids
  // belong to the admin's gym.
  if (body.blockedProgramIds !== undefined) {
    const ids = body.blockedProgramIds
    if (!Array.isArray(ids)) return NextResponse.json({ error: 'Invalid class groups' }, { status: 400 })
    const gymId = session.user.gymId
    if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })
    const valid = await prisma.classProgram.findMany({ where: { id: { in: ids }, gymId }, select: { id: true } })
    if (valid.length !== ids.length) return NextResponse.json({ error: 'Invalid class group' }, { status: 400 })

    const prev = await prisma.user.findUnique({ where: { id }, select: { blockedProgramIds: true } })
    const prevBlocked = prev?.blockedProgramIds ?? []
    const nowBlocked = ids.filter(p => !prevBlocked.includes(p))
    if (nowBlocked.length > 0) {
      const forums = await prisma.forum.findMany({ where: { programId: { in: nowBlocked } }, select: { id: true } })
      if (forums.length > 0) {
        await prisma.forumSubscription.deleteMany({ where: { userId: id, forumId: { in: forums.map(f => f.id) } } })
      }
    }
    // Auto-subscribe to a class group's forum when access is (re)granted.
    const nowUnblocked = prevBlocked.filter(p => !ids.includes(p))
    if (nowUnblocked.length > 0) {
      const forums = await prisma.forum.findMany({ where: { programId: { in: nowUnblocked } }, select: { id: true } })
      if (forums.length > 0) {
        await prisma.forumSubscription.createMany({ data: forums.map(f => ({ userId: id, forumId: f.id })), skipDuplicates: true })
      }
    }
    await prisma.user.update({ where: { id }, data: { blockedProgramIds: ids } })
    return NextResponse.json({ success: true })
  }

  // Legacy fixed-enum class groups (demo gym)
  const blockedClassGroups = body.blockedClassGroups
  if (!Array.isArray(blockedClassGroups) || blockedClassGroups.some(g => !VALID_GROUPS.includes(g as ClassGroup))) {
    return NextResponse.json({ error: 'Invalid groups' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { blockedClassGroups: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prevBlocked = user.blockedClassGroups as ClassGroup[]
  const newBlocked = blockedClassGroups as ClassGroup[]

  const nowBlocked = newBlocked.filter(g => !prevBlocked.includes(g))
  if (nowBlocked.length > 0) {
    const forumIds = nowBlocked.map(g => GROUP_FORUM_IDS[g])
    await prisma.forumSubscription.deleteMany({
      where: { userId: id, forumId: { in: forumIds } },
    })
  }

  // Auto-subscribe to a group's forum when access is (re)granted.
  const nowUnblocked = prevBlocked.filter(g => !newBlocked.includes(g))
  if (nowUnblocked.length > 0) {
    const forumIds = nowUnblocked.map(g => GROUP_FORUM_IDS[g]).filter(Boolean)
    const existing = await prisma.forum.findMany({ where: { id: { in: forumIds } }, select: { id: true } })
    if (existing.length > 0) {
      await prisma.forumSubscription.createMany({ data: existing.map(f => ({ userId: id, forumId: f.id })), skipDuplicates: true })
    }
  }

  await prisma.user.update({
    where: { id },
    data: { blockedClassGroups: newBlocked as ClassGroup[] },
  })

  return NextResponse.json({ success: true })
}
