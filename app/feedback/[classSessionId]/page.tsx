import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/database'
import { getGymSettings } from '@/lib/gymSettings'
import { FeedbackWizard } from './FeedbackWizard'

export default async function FeedbackPage({ params }: { params: Promise<{ classSessionId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { classSessionId } = await params

  const [classSession, existing, gymSettings] = await Promise.all([
    prisma.classSession.findUnique({
      where: { id: classSessionId },
      select: { date: true, class: { select: { title: true } } },
    }),
    prisma.classFeedback.findUnique({
      where: { userId_classSessionId: { userId: session.user.id, classSessionId } },
      select: { id: true },
    }),
    getGymSettings(session.user.gymId),
  ])

  if (!classSession) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Feedback</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{classSession.class.title}</h1>
        <p className="text-sm text-ash mt-1">
          {new Date(classSession.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
        </p>
      </div>

      {existing ? (
        <div className="border border-smoke bg-paper p-6 text-center">
          <p className="text-ink text-sm">You've already submitted feedback for this class.</p>
        </div>
      ) : (
        <FeedbackWizard
          classSessionId={classSessionId}
          reviewUrl={gymSettings.reviewUrl ?? null}
        />
      )}
    </div>
  )
}
