import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { JOURNAL_PROMPTS, GuidedResponse } from '@/lib/journalPrompts'
import { JournalForm } from '../JournalForm'
import { canViewLog } from '@/lib/journalShare'
import { JournalShareControl } from './JournalShareControl'

const CATEGORY_LABELS = { wellness: 'Wellness', training: 'Training', reflection: 'Reflection' }

export default async function JournalEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const { edit } = await searchParams

  const log = await prisma.trainingLog.findUnique({
    where: { id },
    include: {
      classSession: { select: { id: true, date: true, class: { select: { title: true } } } },
    },
  })

  if (!log) notFound()

  // Visibility (Phase 54): owner, an active-share recipient, or a same-gym
  // instructor/admin for non-private entries.
  const owner = await prisma.user.findUnique({ where: { id: log.userId }, select: { gymId: true, name: true } })
  const isOwner = log.userId === session.user.id
  if (!isOwner) {
    const allowed = await canViewLog(
      { id: session.user.id, roles: session.user.roles ?? [], gymId: session.user.gymId ?? null },
      { id: log.id, userId: log.userId, isPrivate: log.isPrivate },
      owner?.gymId ?? null,
    )
    if (!allowed) notFound()
  }

  const guidedResponses = log.guidedResponses as GuidedResponse[] | null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultJournalPrompts: true },
  })
  const defaultKeys: string[] = user?.defaultJournalPrompts
    ? JSON.parse(user.defaultJournalPrompts)
    : JOURNAL_PROMPTS.map(p => p.key)

  if (edit === '1' && isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-2">
          <Link href={`/journal/${id}`} className="text-xs text-ash hover:text-ink transition-colors">← Entry</Link>
        </div>
        <div className="mb-8">
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Journal</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Edit Entry</h1>
        </div>
        <JournalForm
          classSessionId={log.classSessionId}
          defaultPromptKeys={defaultKeys}
          initial={{
            id: log.id,
            title: log.title ?? null,
            isPrivate: log.isPrivate,
            isGuided: log.isGuided,
            freeFormContent: log.freeFormContent,
            guidedResponses,
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/journal" className="text-xs text-ash hover:text-ink transition-colors">← Journal</Link>
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Journal</span>
          </div>
          <h1 className="font-display text-2xl text-ink">
            {log.title || (log.classSession ? log.classSession.class.title : 'Journal Entry')}
          </h1>
          <p className="text-sm text-ash mt-1">
            {log.classSession
              ? new Date(log.classSession.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
              : new Date(log.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {!isOwner && owner?.name && <> · by {owner.name}</>}
          </p>
        </div>
        {isOwner && (
          <Link
            href={`/journal/${id}?edit=1`}
            className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
          >
            Edit
          </Link>
        )}
      </div>

      {isOwner && <JournalShareControl logId={log.id} instructorCanSee={!log.isPrivate} />}

      <div className="flex gap-2 mb-6">
        {log.isPrivate && (
          <span className="px-2 py-0.5 bg-mist text-steel text-xs font-bold uppercase tracking-wide">Private</span>
        )}
        <span className="px-2 py-0.5 bg-mist text-steel text-xs font-bold uppercase tracking-wide">
          {log.isGuided ? 'Guided' : 'Free-form'}
        </span>
      </div>

      {!log.isGuided && (
        <div className="border border-smoke bg-paper p-6">
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{log.freeFormContent ?? '(empty)'}</p>
        </div>
      )}

      {log.isGuided && guidedResponses && guidedResponses.length > 0 && (
        <div className="flex flex-col gap-6">
          {(['wellness', 'training', 'reflection'] as const).map(cat => {
            const prompts = JOURNAL_PROMPTS.filter(p => p.category === cat)
            const answers = guidedResponses.filter(r => prompts.some(p => p.key === r.promptKey))
            if (answers.length === 0) return null
            return (
              <div key={cat} className="border border-smoke bg-paper p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">{CATEGORY_LABELS[cat]}</p>
                <div className="flex flex-col gap-4">
                  {answers.map(r => (
                    <div key={r.promptKey}>
                      <p className="text-xs text-ash uppercase tracking-wider mb-1">{r.question}</p>
                      <p className="text-sm text-ink">{r.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {log.isGuided && (!guidedResponses || guidedResponses.length === 0) && (
        <div className="border border-smoke bg-paper p-6">
          <p className="text-ash text-sm italic">No responses recorded.</p>
        </div>
      )}
    </div>
  )
}
