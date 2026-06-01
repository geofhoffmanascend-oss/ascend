import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { JOURNAL_PROMPTS } from '@/lib/journalPrompts'
import { getEffectiveFeatures } from '@/lib/features'
import { JournalForm } from '../JournalForm'

export default async function NewJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { journal } = await getEffectiveFeatures(session)
  if (!journal) redirect('/dashboard')

  const { sessionId } = await searchParams

  const [user, classSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultJournalPrompts: true },
    }),
    sessionId
      ? prisma.classSession.findUnique({
          where: { id: sessionId },
          select: { id: true, date: true, class: { select: { title: true } } },
        })
      : Promise.resolve(null),
  ])

  const defaultKeys: string[] = user?.defaultJournalPrompts
    ? JSON.parse(user.defaultJournalPrompts)
    : JOURNAL_PROMPTS.map(p => p.key)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Journal</span>
        </div>
        <h1 className="font-display text-2xl text-ink">New Entry</h1>
        {classSession && (
          <p className="text-sm text-ash mt-1">
            {classSession.class.title} · {new Date(classSession.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
          </p>
        )}
      </div>
      <JournalForm
        classSessionId={classSession?.id ?? null}
        defaultPromptKeys={defaultKeys}
      />
    </div>
  )
}
