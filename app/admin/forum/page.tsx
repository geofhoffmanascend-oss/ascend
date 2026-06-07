import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export default async function AdminForumPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  // Scope to THIS gym's forums (multi-tenancy). Global forums (belt/group, gymId
  // null) are moderated by site_admin, not gym admins.
  const forums = await prisma.forum.findMany({
    where: { gymId: session.user.gymId ?? null },
    include: {
      _count: { select: { posts: true, subscriptions: true } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true, content: true, pinned: true, createdAt: true,
          author: { select: { name: true } },
        },
      },
    },
    orderBy: { type: 'asc' },
  })

  const FORUM_LABELS: Record<string, string> = {
    general: 'General', announcement: 'Announcements',
    class_forum: 'Class Forum', private_lesson: 'Private Lessons',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Forum Moderation</h1>
      </div>

      <div className="flex flex-col gap-4">
        {forums.map(f => (
          <div key={f.id} className="border border-smoke bg-paper p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-ink">{f.title}</p>
                <p className="text-xs text-ash">{FORUM_LABELS[f.type] ?? f.type} · {f._count.posts} posts · {f._count.subscriptions} subscribers</p>
              </div>
              <Link href={`/forum/${f.id}`} className="text-xs text-brand-red hover:text-brand-red-dark transition-colors">
                Open Forum →
              </Link>
            </div>
            {f.posts.length > 0 && (
              <div className="border-t border-smoke pt-3 flex flex-col gap-2">
                {f.posts.map(p => (
                  <div key={p.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-ink truncate">{p.content}</p>
                      <p className="text-xs text-ash">{p.author.name} · {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    {p.pinned && <span className="text-xs text-brand-red font-bold flex-shrink-0">Pinned</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
