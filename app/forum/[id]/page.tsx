import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ForumClient } from './ForumClient'

export default async function ForumPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const forum = await prisma.forum.findUnique({
    where: { id },
    include: {
      posts: {
        where: { parentId: null },
        include: {
          author: { select: { name: true, belt: true, role: true } },
          replies: {
            include: { author: { select: { name: true, belt: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      subscriptions: { where: { userId: session.user.id }, select: { id: true } },
    },
  })

  if (!forum) notFound()

  const posts = forum.posts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    replies: p.replies.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }))

  const isSubscribed = forum.subscriptions.length > 0

  const FORUM_LABELS: Record<string, string> = {
    general: 'General', announcement: 'Announcements',
    class_forum: 'Class Forum', private_lesson: 'Private Lessons',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/forum" className="text-xs text-ash hover:text-ink transition-colors">← Forums</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            {FORUM_LABELS[forum.type] ?? 'Forum'}
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">{forum.title}</h1>
        {forum.description && <p className="text-ash text-sm mt-1">{forum.description}</p>}
      </div>

      <ForumClient
        forumId={forum.id}
        posts={posts}
        userId={session.user.id}
        userRole={session.user.role}
        isSubscribed={isSubscribed}
        forumType={forum.type}
      />
    </div>
  )
}
