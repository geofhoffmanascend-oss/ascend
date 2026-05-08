import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: forumId } = await params
  const { content, type, videoUrl, parentId } = await req.json()

  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  if (type === 'announcement' && session.user.role !== 'instructor' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const post = await prisma.post.create({
    data: {
      forumId,
      authorId: session.user.id,
      content: content.trim(),
      type: type ?? 'text',
      videoUrl: videoUrl?.trim() || null,
      parentId: parentId || null,
    },
    include: {
      author: { select: { name: true, belt: true, role: true } },
    },
  })

  return NextResponse.json(post, { status: 201 })
}
