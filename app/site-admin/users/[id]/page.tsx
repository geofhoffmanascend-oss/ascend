import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { SiteUserEditClient } from './SiteUserEditClient'

export const metadata: Metadata = { title: 'User — Site Admin' }

const since30 = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d }

export default async function SiteAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('site_admin')) redirect('/dashboard')

  const { id } = await params
  const [user, gyms, logins30, attendance30, postCount, commitmentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, belt: true, stripes: true,
        beltVerified: true, gymId: true, roles: true, createdAt: true, lastLoginAt: true,
        gym: { select: { name: true, slug: true } },
      },
    }),
    prisma.gym.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.loginEvent.count({ where: { userId: id, createdAt: { gte: since30() } } }),
    prisma.attendance.count({ where: { userId: id, attended: true, classSession: { date: { gte: since30() } } } }),
    prisma.post.count({ where: { authorId: id } }),
    prisma.commitment.count({ where: { userId: id } }),
  ])
  if (!user) notFound()

  const fmt = (d: Date | null) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="border border-smoke bg-paper px-4 py-3">
      <p className="text-lg font-display font-bold text-ink">{value}</p>
      <p className="text-xs text-ash uppercase tracking-wide">{label}</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/site-admin/users" className="text-xs text-ash hover:text-ink transition-colors">← Users</Link>
        <Link href={`/profile/${user.id}`} className="text-xs text-brand-red hover:underline">View public profile →</Link>
      </div>

      <h1 className="font-display text-2xl text-ink mb-1">{user.name ?? '—'}</h1>
      <p className="text-sm text-ash mb-6">{user.email} · {user.gym?.name ?? 'No gym'} · {(user.roles ?? []).join(', ')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Last login" value={fmt(user.lastLoginAt)} />
        <Stat label="Logins (30d)" value={logins30} />
        <Stat label="Member since" value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
        <Stat label="Attended (30d)" value={attendance30} />
        <Stat label="Forum posts" value={postCount} />
        <Stat label="Class commits" value={commitmentCount} />
      </div>

      <SiteUserEditClient
        initial={{
          id: user.id, name: user.name, email: user.email, phone: user.phone,
          belt: user.belt, stripes: user.stripes ?? 0, beltVerified: user.beltVerified,
          gymId: user.gymId, roles: (user.roles ?? []) as string[],
        }}
        gyms={gyms}
      />
    </div>
  )
}
