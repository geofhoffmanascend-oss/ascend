import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'

// All posts in a forum (top-level + replies) for site-admin moderation.
export async function GET(req: NextRequest) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const forumId = req.nextUrl.searchParams.get('forumId')
  if (!forumId) return NextResponse.json({ posts: [] })

  const posts = await prisma.post.findMany({
    where: { forumId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, content: true, createdAt: true, parentId: true, imageUrl: true,
      author: { select: { name: true } },
    },
  })
  return NextResponse.json({
    posts: posts.map(p => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      isReply: p.parentId !== null,
      imageUrl: p.imageUrl,
      authorName: p.author.name ?? 'Unknown',
    })),
  })
}
