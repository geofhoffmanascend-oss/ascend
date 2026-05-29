import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { GymEditClient } from './GymEditClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gym = await prisma.gym.findUnique({ where: { id }, select: { name: true } })
  return { title: gym?.name ?? 'Gym — Site Admin' }
}

export default async function SiteAdminGymDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [gym, members, gymForum] = await Promise.all([
    prisma.gym.findUnique({ where: { id } }),
    prisma.gymMembership.findMany({
      where: { gymId: id, status: 'active' },
      include: { user: { select: { id: true, name: true, email: true, belt: true, roles: true } } },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.forum.findFirst({
      where: { gymId: id, type: 'gym_forum' },
      select: { id: true, title: true, _count: { select: { posts: true } } },
    }),
  ])

  if (!gym) notFound()

  const gymForumTyped = gymForum as typeof gymForum & { _count: { posts: number } } | null

  return (
    <div className="px-6 py-10 max-w-4xl">
      <div className="mb-3">
        <Link href="/site-admin/gyms" className="text-xs text-ash hover:text-ink transition-colors">← Gyms</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Gym Detail</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{gym.name}</h1>
      </div>

      <div className="flex flex-col gap-6">
        <GymEditClient gym={{
          id: gym.id,
          name: gym.name,
          slug: gym.slug,
          headInstructorName: gym.headInstructorName,
          address: gym.address,
          city: gym.city,
          state: gym.state,
          zip: gym.zip,
          phone: gym.phone,
          website: gym.website,
          description: gym.description,
          logoUrl: gym.logoUrl,
          participatingStatus: gym.participatingStatus,
          paymentTerms: gym.paymentTerms as Record<string, number> | null,
        }} />

        {/* Members */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">
            Active Members ({members.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-smoke">
                  <th className="text-left py-2 text-xs text-ash font-medium">Name</th>
                  <th className="text-left py-2 text-xs text-ash font-medium">Email</th>
                  <th className="text-left py-2 text-xs text-ash font-medium">Belt</th>
                  <th className="text-left py-2 text-xs text-ash font-medium">Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-smoke">
                {members.map(m => (
                  <tr key={m.id}>
                    <td className="py-2 text-ink">{m.user.name ?? '—'}</td>
                    <td className="py-2 text-ash">{m.user.email}</td>
                    <td className="py-2 text-ash capitalize">{m.user.belt}</td>
                    <td className="py-2 text-ash">{(m.user.roles as string[]).join(', ')}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-ash italic">No active members.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gym Forum */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Gym Forum</p>
          {gymForumTyped ? (
            <Link href={`/forum/${gymForumTyped.id}`} className="text-sm text-brand-red hover:underline">
              {gymForumTyped.title} — {gymForumTyped._count.posts} posts →
            </Link>
          ) : (
            <p className="text-sm text-ash italic">No gym forum created yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
