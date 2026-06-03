import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { canPostInBeltForum } from '@/lib/belt'
import { getPlatformSettings } from '@/lib/platformSettings'
import { PUBLIC_FORUM_TYPES } from '@/lib/feed'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: forumId } = await params
  const { content, type, videoUrl, parentId, imageUrl } = await req.json()

  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  if (type === 'announcement' && !session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const forum = await prisma.forum.findUnique({ where: { id: forumId }, select: { type: true, gymId: true, beltLevel: true } })

  // Gym forum: verify caller belongs to this gym
  if (forum && (forum.type as string) === 'gym_forum') {
    const isSiteAdmin = session.user.roles?.includes('site_admin')
    if (!isSiteAdmin && session.user.gymId !== forum.gymId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Belt forum: verify caller's belt is high enough
  if (forum && forum.type === 'belt_forum' && forum.beltLevel) {
    const isSiteAdmin = session.user.roles?.includes('site_admin')
    const isAdmin = session.user.roles?.includes('admin')
    if (!isSiteAdmin && !isAdmin) {
      const { allowBeltForumPosting } = await getPlatformSettings()
      if (!allowBeltForumPosting) return NextResponse.json({ error: 'Belt forum posting is not available yet.' }, { status: 403 })
    }
    const userBelt = session.user.belt ?? 'white'
    if (!canPostInBeltForum(userBelt, forum.beltLevel)) {
      return NextResponse.json({ error: 'Your belt level does not allow posting in this forum' }, { status: 403 })
    }
  }

  const cleanImage = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null

  const post = await prisma.post.create({
    data: {
      forumId,
      authorId: session.user.id,
      content: content.trim(),
      type: type ?? 'text',
      videoUrl: videoUrl?.trim() || null,
      imageUrl: cleanImage,
      parentId: parentId || null,
    },
    include: {
      author: { select: { name: true, belt: true } },
      forum: { select: { title: true } },
      parent: { select: { authorId: true } },
    },
  })

  // Forum gallery (Phase 49): a posted photo becomes a forum-scoped MediaItem,
  // linked to the post (cascade-deletes with it). Excluded from the main gallery.
  if (cleanImage) {
    await prisma.mediaItem.create({
      data: {
        uploaderId: session.user.id,
        url: cleanImage,
        type: 'photo',
        caption: content.trim().slice(0, 200),
        visibility: 'private',
        gymId: forum?.gymId ?? null,
        forumId,
        postId: post.id,
      },
    })
  }

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
    const notified = new Set(subscriptions.map(s => s.userId))
    await Promise.all(
      subscriptions.map(sub =>
        createNotification(sub.userId, 'general', `New post in ${post.forum.title}`, {
          body: `${authorName}: ${snippet}`,
          link,
        })
      )
    )

    // Activity feed: also notify the author's followers, but only for public-forum
    // posts (never restricted content), and skip anyone already notified as a subscriber.
    if (forum && (PUBLIC_FORUM_TYPES as readonly string[]).includes(forum.type)) {
      const followers = await prisma.follow.findMany({
        where: { followingId: session.user.id },
        select: { followerId: true },
      })
      await Promise.all(
        followers
          .filter(f => f.followerId !== session.user.id && !notified.has(f.followerId))
          .map(f =>
            createNotification(f.followerId, 'followed_post', `${authorName} posted in ${post.forum.title}`, {
              body: snippet,
              link,
            })
          )
      )
    }
  }

  return NextResponse.json(post, { status: 201 })
}
