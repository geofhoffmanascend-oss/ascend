import { NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'
import { Belt } from '@prisma/client'

const BELT_FORUMS: { belt: Belt; title: string }[] = [
  { belt: 'white',  title: 'White Belt Forum' },
  { belt: 'blue',   title: 'Blue Belt Forum' },
  { belt: 'purple', title: 'Purple Belt Forum' },
  { belt: 'brown',  title: 'Brown Belt Forum' },
  { belt: 'black',  title: 'Black Belt Forum' },
]

export async function POST() {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const forums = await Promise.all(
    BELT_FORUMS.map(async ({ belt, title }) => {
      const existing = await prisma.forum.findFirst({
        where: { type: 'belt_forum', beltLevel: belt },
      })
      if (existing) return existing
      return prisma.forum.create({
        data: { type: 'belt_forum', beltLevel: belt, title },
      })
    })
  )

  return NextResponse.json({ forums })
}
