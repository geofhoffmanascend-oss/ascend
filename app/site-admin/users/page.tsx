import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'

export const metadata: Metadata = { title: 'Users — Site Admin' }

export default async function SiteAdminUsersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; gym?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('site_admin')) redirect('/dashboard')

  const { q, gym } = await searchParams
  const since = new Date(); since.setDate(since.getDate() - 30)

  const where = {
    ...(q && { OR: [
      { name:  { contains: q, mode: 'insensitive' as const } },
      { email: { contains: q, mode: 'insensitive' as const } },
    ] }),
    ...(gym && { gymId: gym }),
  }

  const [users, gyms, logins] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, roles: true, lastLoginAt: true, gym: { select: { name: true } } },
      orderBy: [{ gym: { name: 'asc' } }, { name: 'asc' }],
      take: 500,
    }),
    prisma.gym.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.loginEvent.groupBy({ by: ['userId'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
  ])
  const logins30 = Object.fromEntries(logins.map(l => [l.userId, l._count._all]))
  const fmt = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="px-6 py-10">
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Users</span>
        </div>
        <h1 className="font-display text-2xl text-ink">All Users <span className="text-sm text-ash font-sans">({users.length})</span></h1>
      </div>

      <form method="GET" className="flex flex-wrap gap-2 mb-5">
        <input name="q" defaultValue={q ?? ''} placeholder="Search name or email…" className="flex-1 min-w-[200px] px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
        <select name="gym" defaultValue={gym ?? ''} className="px-3 py-2 border border-smoke bg-paper text-ink text-sm">
          <option value="">All gyms</option>
          {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">Search</button>
        {(q || gym) && <Link href="/site-admin/users" className="px-4 py-2 border border-smoke text-steel text-sm hover:border-steel">Clear</Link>}
      </form>

      <div className="border border-smoke bg-paper overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-smoke text-left text-xs uppercase tracking-wide text-steel">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Gym</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2">30d</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-smoke/60 hover:bg-mist/50">
                <td className="px-3 py-2"><Link href={`/site-admin/users/${u.id}`} className="text-brand-red font-medium hover:underline">{u.name ?? '—'}</Link></td>
                <td className="px-3 py-2 text-ash">{u.email}</td>
                <td className="px-3 py-2 text-steel">{u.gym?.name ?? '—'}</td>
                <td className="px-3 py-2 text-ash text-xs">{(u.roles ?? []).join(', ')}</td>
                <td className="px-3 py-2 text-steel">{fmt(u.lastLoginAt)}</td>
                <td className="px-3 py-2 text-steel">{logins30[u.id] ?? 0}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-ash italic">No users match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
