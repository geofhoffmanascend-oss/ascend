import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { ForumModerationClient } from './ForumModerationClient'

export const metadata = { title: 'Forum Moderation — Site Admin' }

export default async function SiteAdminForumsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  const beltForums = await prisma.forum.findMany({
    where: { type: 'belt_forum' },
    orderBy: { beltLevel: 'asc' },
    select: { id: true, title: true, beltLevel: true },
  })

  return (
    <div className="px-6 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Forums</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Belt Forum Moderation</h1>
      </div>

      {beltForums.length === 0 ? (
        <p className="text-ash text-sm italic">
          No belt forums initialized yet. POST to <code className="bg-mist px-1">/api/site-admin/belt-forums/init</code> first.
        </p>
      ) : (
        <ForumModerationClient forums={beltForums.map(f => ({ ...f, beltLevel: f.beltLevel as string | null }))} />
      )}
    </div>
  )
}
