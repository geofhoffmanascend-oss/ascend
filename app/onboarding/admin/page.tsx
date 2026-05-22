import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { AdminOnboardingWizard } from './AdminOnboardingWizard'

export const metadata: Metadata = { title: 'Admin Setup' }

export default async function AdminOnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true, onboardedRoles: true },
  })

  if (!user) redirect('/login')

  const roles = user.roles ?? []
  const onboardedRoles = user.onboardedRoles ?? []

  if (!roles.includes('admin')) redirect('/dashboard')
  if (onboardedRoles.includes('admin')) redirect('/admin')

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Admin Onboarding
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Welcome, admin</h1>
          <p className="text-slate text-sm mt-2">Let's make sure everything's set up before you dive in.</p>
        </div>
        <AdminOnboardingWizard />
      </div>
    </div>
  )
}
