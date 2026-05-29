import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

export async function GET(req: NextRequest) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const forumId = searchParams.get('forumId')

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      forum: { type: 'belt_forum' },
      ...(forumId ? { forumId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      author: { select: { name: true, belt: true, beltVerified: true } },
      forum: { select: { id: true, title: true, beltLevel: true } },
    },
  })

  const serialized = posts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return NextResponse.json({ posts: serialized })
}
