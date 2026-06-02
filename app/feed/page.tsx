import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { PUBLIC_FORUM_TYPES } from '@/lib/feed'

export const metadata: Metadata = { title: 'Feed' }

export default async function FeedPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  })
  const followingIds = following.map(f => f.followingId)

  const posts = followingIds.length
    ? await prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
          parentId: null,
          forum: { type: { in: [...PUBLIC_FORUM_TYPES] } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, content: true, createdAt: true,
          author: { select: { id: true, name: true, avatarUrl: true } },
          forum: { select: { id: true, title: true } },
        },
      })
    : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Feed</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Following</h1>
        <p className="text-sm text-slate mt-1">Recent posts from people you follow.</p>
      </div>

      {followingIds.length === 0 ? (
        <div className="border border-smoke bg-paper p-6 text-sm text-ash">
          You're not following anyone yet. Visit a member's profile and tap <span className="font-medium text-steel">Follow</span> to see their posts here.
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-smoke bg-paper p-6 text-sm text-ash">
          No recent posts from the {followingIds.length} {followingIds.length === 1 ? 'person' : 'people'} you follow.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(p => (
            <div key={p.id} className="border border-smoke bg-paper p-4">
              <div className="flex items-center gap-3 mb-2">
                {p.author.avatarUrl ? (
                  <img src={p.author.avatarUrl} alt={p.author.name ?? ''} className="w-8 h-8 rounded-full object-cover border border-smoke" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-mist border border-smoke flex items-center justify-center text-xs font-bold text-steel">
                    {(p.author.name ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <Link href={`/profile/${p.author.id}`} className="text-sm font-medium text-ink hover:text-brand-red transition-colors">
                    {p.author.name ?? 'Unknown'}
                  </Link>
                  <p className="text-xs text-ash">
                    {p.forum.title} · {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <Link href={`/forum/${p.forum.id}`} className="block text-sm text-ink leading-relaxed hover:text-steel transition-colors">
                {p.content}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
