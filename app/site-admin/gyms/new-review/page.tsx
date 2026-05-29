import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export const metadata = { title: 'New Gyms — Site Admin' }

export default async function NewGymsReviewPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const gyms = await prisma.gym.findMany({
    where: { participatingStatus: 'free', createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'desc' },
  })

  const gymIds = gyms.map(g => g.id)
  const activeCounts = await prisma.gymMembership.groupBy({
    by: ['gymId'],
    where: { gymId: { in: gymIds }, status: 'active' },
    _count: true,
  })
  const activeMap = Object.fromEntries(activeCounts.map(r => [r.gymId, r._count]))

  return (
    <div className="px-6 py-10">
      <div className="mb-3">
        <Link href="/site-admin" className="text-xs text-ash hover:text-ink transition-colors">← Dashboard</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">New Gyms</span>
        </div>
        <h1 className="font-display text-2xl text-ink">New Gym Review</h1>
        <p className="text-sm text-ash mt-1">Free-tier gyms registered in the last 30 days. {gyms.length} found.</p>
      </div>

      {gyms.length === 0 ? (
        <p className="text-ash text-sm italic">No new gyms in the last 30 days.</p>
      ) : (
        <div className="border border-smoke overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-mist border-b border-smoke">
              <tr>
                {['Gym', 'Location', 'Head Instructor', 'Members', 'Registered'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-steel">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-smoke">
              {gyms.map(gym => (
                <tr key={gym.id} className="hover:bg-mist/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/site-admin/gyms/${gym.id}`} className="text-brand-red hover:underline font-medium">
                      {gym.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ash">{[gym.city, gym.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-ash">{gym.headInstructorName ?? '—'}</td>
                  <td className="px-4 py-3 text-ink">{activeMap[gym.id] ?? 0}</td>
                  <td className="px-4 py-3 text-ash">
                    {gym.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
