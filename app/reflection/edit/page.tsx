import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { ReflectionForm } from './ReflectionForm'

export const metadata: Metadata = { title: 'Training Reflection' }

export default async function ReflectionEditPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const reflection = await prisma.trainingReflection.findUnique({
    where: { userId: session.user.id },
    select: { whyStarted: true, challenges: true, goals: true, privacy: true },
  })

  return (
    <div className="min-h-full bg-paper px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              My Training
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">Training Reflection</h1>
          <p className="text-slate text-sm mt-2">
            Record your why, your challenges, and your goals. Private by default.
          </p>
        </div>

        <div className="border border-smoke bg-paper p-8">
          <ReflectionForm
            existing={
              reflection
                ? {
                    whyStarted: reflection.whyStarted,
                    challenges: reflection.challenges,
                    goals: reflection.goals,
                    privacy: reflection.privacy as 'public' | 'members' | 'private',
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  )
}
