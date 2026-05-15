import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'

export const metadata = { title: 'Get Started' }

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Welcome
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Set up your profile</h1>
          <p className="text-slate text-sm mt-2">Tell us a bit about yourself. You can edit this later.</p>
        </div>
        <OnboardingWizard userId={session.user.id} />
      </div>
    </div>
  )
}
