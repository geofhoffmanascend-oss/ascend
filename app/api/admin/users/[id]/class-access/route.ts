import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForUser } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'
import { GROUP_FORUM_IDS } from '@/lib/classGroups'

const VALID_GROUPS = Object.values(ClassGroup)

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdminForUser(id)
  if (error) return error

  const { blockedClassGroups } = await req.json() as { blockedClassGroups: string[] }

  if (!Array.isArray(blockedClassGroups) || blockedClassGroups.some(g => !VALID_GROUPS.includes(g as ClassGroup))) {
    return NextResponse.json({ error: 'Invalid groups' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { blockedClassGroups: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prevBlocked = user.blockedClassGroups as ClassGroup[]
  const newBlocked = blockedClassGroups as ClassGroup[]

  // Groups newly being blocked — remove forum subscriptions
  const nowBlocked = newBlocked.filter(g => !prevBlocked.includes(g))
  if (nowBlocked.length > 0) {
    const forumIds = nowBlocked.map(g => GROUP_FORUM_IDS[g])
    await prisma.forumSubscription.deleteMany({
      where: { userId: id, forumId: { in: forumIds } },
    })
  }

  await prisma.user.update({
    where: { id },
    data: { blockedClassGroups: newBlocked as ClassGroup[] },
  })

  return NextResponse.json({ success: true })
}
