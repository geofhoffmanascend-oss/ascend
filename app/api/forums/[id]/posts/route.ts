import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: forumId } = await params
  const { content, type, videoUrl, parentId } = await req.json()

  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  if (type === 'announcement' && !session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) {
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
      author: { select: { name: true, belt: true } },
      forum: { select: { title: true } },
      parent: { select: { authorId: true } },
    },
  })

  const authorName = session.user.name ?? 'Someone'
  const snippet = content.trim().slice(0, 80)
  const link = `/forum/${forumId}`

  if (parentId) {
    // Reply — notify the original post's author (unless they're replying to themselves)
    const parentAuthorId = post.parent?.authorId
    if (parentAuthorId && parentAuthorId !== session.user.id) {
      await createNotification(parentAuthorId, 'general', `${authorName} replied to your post`, {
        body: snippet,
        link,
      })
    }
  } else {
    // New top-level post — notify all forum subscribers except the poster
    const subscriptions = await prisma.forumSubscription.findMany({
      where: { forumId, userId: { not: session.user.id } },
      select: { userId: true },
    })
    await Promise.all(
      subscriptions.map(sub =>
        createNotification(sub.userId, 'general', `New post in ${post.forum.title}`, {
          body: `${authorName}: ${snippet}`,
          link,
        })
      )
    )
  }

  return NextResponse.json(post, { status: 201 })
}
