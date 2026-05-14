import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'
import { GROUP_LABELS, GROUP_DESCRIPTIONS, GROUP_FORUM_IDS } from '@/lib/classGroups'

export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  const results: string[] = []

  for (const group of Object.values(ClassGroup)) {
    const forum = await prisma.forum.upsert({
      where: { id: GROUP_FORUM_IDS[group] },
      update: {},
      create: {
        id: GROUP_FORUM_IDS[group],
        type: 'group_forum' as any,
        classGroup: group,
        title: `${GROUP_LABELS[group]} Forum`,
        description: GROUP_DESCRIPTIONS[group],
      },
    })
    results.push(`${group}: ${forum.id}`)
  }

  return NextResponse.json({ created: results })
}
