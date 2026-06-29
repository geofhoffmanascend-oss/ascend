import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import Image from 'next/image'
import Link from 'next/link'
import { OnboardingWizard } from './OnboardingWizard'
import { primaryTourForUser, TOURS } from '@/lib/tour'

export const metadata: Metadata = { title: 'Get Started' }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const initialGymId = params.gymId ?? null
  const initialGymName = params.gymName ?? null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, belt: true, stripes: true, roles: true, onboardedRoles: true, onboardingDone: true },
  })

  if (!user) redirect('/login')

  // After student onboarding, instructor goes to instructor onboarding
  const roles = user.roles ?? []
  const onboardedRoles = user.onboardedRoles ?? []

  let redirectAfter = '/dashboard'
  if (roles.includes('instructor') && !onboardedRoles.includes('instructor')) {
    redirectAfter = '/onboarding/instructor'
  }
  // If also admin, instructor onboarding will redirect to admin onboarding
  // (handled in instructor onboarding page)

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="AscendIt" width={72} height={72} className="object-contain" />
          </div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Welcome to AscendIt
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Let's get you set up</h1>
          <p className="text-slate text-sm mt-2">Quick setup — takes about 2 minutes. Everything is optional.</p>
          <Link
            href={TOURS[primaryTourForUser(user.roles ?? [])].href}
            className="inline-block text-sm text-brand-red font-medium mt-3 hover:underline"
          >
            New here? Take a quick tour first →
          </Link>
        </div>
        <OnboardingWizard
          userId={user.id}
          userName={user.name ?? ''}
          userBelt={(user.belt as 'white' | 'blue' | 'purple' | 'brown' | 'black') ?? 'white'}
          userStripes={user.stripes ?? 0}
          redirectAfter={redirectAfter}
          initialGymId={initialGymId}
          initialGymName={initialGymName}
        />
      </div>
    </div>
  )
}
