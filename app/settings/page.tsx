import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { SettingsForm } from './SettingsForm'
import { ClassGroup } from '@prisma/client'
import Image from 'next/image'

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
        competeTournaments:    true,
        acceptsChallenges:     true,
        defaultJournalPrompts: true,
        hiddenClassGroups:     true,
        hiddenProgramIds:      true,
        blockedClassGroups:    true,
        blockedProgramIds:     true,
        gymId:                 true,
        gym:                   { select: { id: true, name: true } },
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

  // The member's gym class groups (Phase 53) — schedule visibility toggles use
  // these when the gym has defined any; otherwise fall back to the fixed groups.
  const classGroups = user.gymId
    ? await prisma.classProgram.findMany({
        where: { gymId: user.gymId, id: { notIn: (user.blockedProgramIds ?? []) as string[] } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, description: true },
      })
    : []

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
        <div className="flex items-center gap-3 mb-4">
          <Image src="/logo.png" alt="AscendIt" width={40} height={40} className="object-contain" />
          <div className="inline-block bg-brand-red px-3 py-1">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Settings
            </span>
          </div>
        </div>
        <h1 className="font-display text-2xl text-ink">Settings</h1>
      </div>
      <SettingsForm
        userId={session.user.id}
        initial={user}
        forums={forums}
        hiddenClassGroups={(user.hiddenClassGroups ?? []) as ClassGroup[]}
        classGroups={classGroups}
        hiddenProgramIds={(user.hiddenProgramIds ?? []) as string[]}
        currentGym={user.gym ?? null}
      />
    </div>
  )
}
