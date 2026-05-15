import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { SettingsForm } from './SettingsForm'
import { ClassGroup } from '@prisma/client'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [user, allForums, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyClassUpdates:    true,
        notifyInstructorNotes: true,
        notifyPrivateMessages: true,
        notifyCheckinPrompts:  true,
        notifyFeedbackPrompts: true,
        notifyByEmail:         true,
        allowDmsFromStudents:  true,
        allowMediaTagging:     true,
        defaultJournalPrompts: true,
        hiddenClassGroups:     true,
        blockedClassGroups:    true,
      },
    }),
    prisma.forum.findMany({
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, type: true, classGroup: true },
    }),
    prisma.forumSubscription.findMany({
      where: { userId: session.user.id },
      select: { forumId: true },
    }),
  ])

  if (!user) redirect('/login')

  const subscribedIds = new Set(subscriptions.map(s => s.forumId))
  const blocked = (user.blockedClassGroups ?? []) as ClassGroup[]

  const forums = allForums
    .filter(f => {
      // Don't show group forums for admin-blocked groups
      if (f.type === 'group_forum' && f.classGroup && blocked.includes(f.classGroup as ClassGroup)) return false
      return true
    })
    .map(f => ({
      id: f.id,
      title: f.title,
      type: f.type as string,
      classGroup: f.classGroup as string | null,
      subscribed: subscribedIds.has(f.id),
    }))

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Settings
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">Settings</h1>
      </div>
      <SettingsForm
        userId={session.user.id}
        initial={user}
        forums={forums}
        hiddenClassGroups={(user.hiddenClassGroups ?? []) as ClassGroup[]}
      />
    </div>
  )
}
