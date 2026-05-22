import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { InstructorOnboardingWizard } from './InstructorOnboardingWizard'

export const metadata: Metadata = { title: 'Instructor Setup' }

export default async function InstructorOnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true, onboardedRoles: true },
  })

  if (!user) redirect('/login')

  const roles = user.roles ?? []
  const onboardedRoles = user.onboardedRoles ?? []

  // Must be an instructor
  if (!roles.includes('instructor')) redirect('/dashboard')

  // Already completed instructor onboarding
  if (onboardedRoles.includes('instructor')) redirect('/dashboard')

  // After instructor onboarding, admin goes to admin onboarding
  const redirectAfter =
    roles.includes('admin') && !onboardedRoles.includes('admin')
      ? '/onboarding/admin'
      : '/instructor'

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Instructor Onboarding
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Welcome, instructor</h1>
          <p className="text-slate text-sm mt-2">Quick setup before you start teaching.</p>
        </div>
        <InstructorOnboardingWizard userId={user.id} redirectAfter={redirectAfter} />
      </div>
    </div>
  )
}
