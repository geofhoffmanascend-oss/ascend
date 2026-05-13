import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

const FORUM_TYPE_LABELS: Record<string, string> = {
  general: 'General', announcement: 'Announcements',
  class_forum: 'Class', private_lesson: 'Private Lessons',
  instructor_only: 'Instructor',
}

export default async function ForumListPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const isInstructor = session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')
  const publicTypes = isInstructor
    ? ['general', 'announcement', 'instructor_only']
    : ['general', 'announcement']

  const [publicForums, subscriptions] = await Promise.all([
    prisma.forum.findMany({
      where: { type: { in: publicTypes as any[] } },
      include: {
        _count: { select: { posts: true } },
        posts: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, author: { select: { name: true } } } },
      },
    }),
    prisma.forumSubscription.findMany({
      where: { userId: session.user.id },
      include: {
        forum: {
          include: {
            _count: { select: { posts: true } },
            posts: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, author: { select: { name: true } } } },
          },
        },
      },
    }),
  ])

  const classForums = subscriptions
    .map(s => s.forum)
    .filter(f => f.type === 'class_forum')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Forums</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Forums</h1>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">General</p>
          <div className="flex flex-col gap-2">
            {publicForums.map(f => (
              <ForumRow key={f.id} forum={f} />
            ))}
          </div>
        </section>

        {classForums.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">My Classes</p>
            <div className="flex flex-col gap-2">
              {classForums.map(f => (
                <ForumRow key={f.id} forum={f} />
              ))}
            </div>
          </section>
        )}

        {classForums.length === 0 && (
          <p className="text-ash text-sm italic">
            Register for a class to join its forum. <Link href="/schedule" className="text-brand-red hover:text-brand-red-dark">View schedule →</Link>
          </p>
        )}
      </div>
    </div>
  )
}

function ForumRow({ forum }: { forum: { id: string; title: string; type: string; _count: { posts: number }; posts: { createdAt: Date; author: { name: string | null } }[] } }) {
  const latest = forum.posts[0]
  return (
    <Link
      href={`/forum/${forum.id}`}
      className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-medium text-ink">{forum.title}</p>
        {latest && (
          <p className="text-xs text-ash mt-0.5">
            Last post by {latest.author.name ?? 'Unknown'} · {new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
      <p className="text-xs text-ash flex-shrink-0 ml-4">{forum._count.posts} posts</p>
    </Link>
  )
}
