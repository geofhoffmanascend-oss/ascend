import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import Image from 'next/image'
import { OwnerOnboardingWizard } from './OwnerOnboardingWizard'

export const metadata: Metadata = { title: 'Set Up Your Gym' }

export default async function OwnerOnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, gymId: true },
  })
  if (!user) redirect('/login')

  // No gym yet → send them to add/claim one first (returns to this wizard).
  if (!user.gymId) redirect('/gyms/register?returnTo=owner')

  const gym = await prisma.gym.findUnique({
    where: { id: user.gymId },
    select: { id: true, name: true, slug: true },
  })
  if (!gym) redirect('/gyms/register?returnTo=owner')

  // 38.4 — OTHER members already affiliated with this gym (count + small
  // preview). Excludes the owner themselves (added as a member on create).
  // Queried server-side directly (the owner's admin role may still be stale in
  // the JWT this request); mirrors GET /api/gyms/[id]/members.
  const [memberCount, memberRows] = await Promise.all([
    prisma.gymMembership.count({ where: { gymId: gym.id, userId: { not: user.id } } }),
    prisma.gymMembership.findMany({
      where: { gymId: gym.id, userId: { not: user.id } },
      include: { user: { select: { id: true, name: true, belt: true, roles: true } } },
      orderBy: { joinedAt: 'asc' },
      take: 8,
    }),
  ])

  const memberPreview = memberRows.map(m => ({
    id: m.user.id,
    name: m.user.name,
    belt: m.user.belt,
    roles: m.user.roles,
  }))

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="AscendIt" width={72} height={72} className="object-contain" />
          </div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Set Up {gym.name}
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Let's get your gym ready</h1>
          <p className="text-slate text-sm mt-2">You're the admin of {gym.name}. A few steps to get it running.</p>
        </div>

        <OwnerOnboardingWizard
          userId={user.id}
          gymName={gym.name}
          gymSlug={gym.slug}
          memberCount={memberCount}
          memberPreview={memberPreview}
        />
      </div>
    </div>
  )
}
