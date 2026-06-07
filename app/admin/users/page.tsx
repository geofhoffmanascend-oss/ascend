import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { formatRoles } from '@/lib/roles'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; belt?: string; q?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  const { role, belt, q } = await searchParams

  // Scope the roster to THIS admin's gym (multi-tenancy).
  const gymId = session.user.gymId ?? null

  const users = await prisma.user.findMany({
    where: {
      gymId,
      ...(role && { roles: { has: role as 'admin' | 'instructor' | 'student' } }),
      ...(belt && { belt: belt as 'white' | 'blue' | 'purple' | 'brown' | 'black' }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    select: { id: true, name: true, email: true, roles: true, belt: true, stripes: true, createdAt: true },
    orderBy: [{ name: 'asc' }],
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin" className="text-xs text-ash hover:text-ink transition-colors">← Admin</Link>
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Users ({users.length})</h1>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 mb-6">
        <input
          name="q"
          defaultValue={q}
          className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors w-48"
          placeholder="Search name or email…"
        />
        <select name="role" defaultValue={role ?? ''} className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">All roles</option>
          <option value="student">Member</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
        <select name="belt" defaultValue={belt ?? ''} className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors">
          <option value="">All belts</option>
          {['white', 'blue', 'purple', 'brown', 'black'].map(b => (
            <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors">
          Filter
        </button>
        {(q || role || belt) && (
          <Link href="/admin/users" className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">
            Clear
          </Link>
        )}
      </form>

      <div className="flex flex-col gap-1">
        {users.map(u => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="border border-smoke bg-paper px-5 py-3 hover:border-steel transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-mist border border-smoke flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-steel">{(u.name ?? '?')[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{u.name ?? '(no name)'}</p>
                <p className="text-xs text-ash">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BeltBadge belt={u.belt as Belt} stripes={u.stripes} />
              <span className="text-xs text-ash">{formatRoles(u.roles)}</span>
            </div>
          </Link>
        ))}
        {users.length === 0 && <p className="text-ash text-sm italic p-4">No users found.</p>}
      </div>
    </div>
  )
}
