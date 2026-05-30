import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { SiteAdminRoleClient } from './SiteAdminRoleClient'

export const metadata = { title: 'Site Admins — Site Admin' }

export default async function SiteAdminsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('site_admin')) redirect('/dashboard')

  const [siteAdmins, allUsers] = await Promise.all([
    prisma.user.findMany({
      where: { roles: { has: 'site_admin' } },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { roles: { hasEvery: ['student'] } },
      select: { id: true, name: true, email: true, roles: true },
      orderBy: { name: 'asc' },
      take: 200,
    }),
  ])

  return (
    <div className="px-6 py-10 max-w-3xl">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Access</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Site Admin Role</h1>
        <p className="text-sm text-ash mt-1">Only site admins can grant or revoke this role.</p>
      </div>

      <SiteAdminRoleClient
        currentUserId={session.user.id}
        siteAdmins={siteAdmins.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        allUsers={allUsers.map(u => ({ ...u, roles: u.roles as string[] }))}
      />
    </div>
  )
}
