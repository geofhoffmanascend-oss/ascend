import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { SettingsForm } from './SettingsForm'
import Image from 'next/image'
import { TourReplayButton } from '@/app/tour/TourReplayButton'
import { tourRolesForUser } from '@/lib/tour'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const me = session.user.id
  const [user, publicForums, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me },
      select: {
        notifyInstructorNotes: true,
        notifyPrivateMessages: true,
        notifyGroupChats:      true,
        notifyForumActivity:   true,
        notifyCheckinPrompts:  true,
        notifyFeedbackPrompts: true,
        notifyByEmail:         true,
        allowDmsFromStudents:  true,
        allowMediaTagging:     true,
        competeTournaments:    true,
        acceptsChallenges:     true,
        defaultJournalPrompts: true,
        gymId:                 true,
        gym:                   { select: { id: true, name: true } },
      },
    }),
    // Public forums only — private/class/group forums no longer belong in subscriptions.
    prisma.forum.findMany({
      where: { type: { in: ['general', 'announcement'] } },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, type: true, classGroup: true },
    }),
    prisma.forumSubscription.findMany({ where: { userId: me }, select: { forumId: true } }),
  ])

  if (!user) redirect('/login')

  const subscribedIds = new Set(subscriptions.map(s => s.forumId))
  // Dedupe by title (defensive against duplicate forum rows in the DB).
  const seenTitles = new Set<string>()
  const forums = publicForums
    .filter(f => { const k = f.title.toLowerCase(); if (seenTitles.has(k)) return false; seenTitles.add(k); return true })
    .map(f => ({
      id: f.id,
      title: f.title,
      type: f.type as string,
      classGroup: f.classGroup as string | null,
      subscribed: subscribedIds.has(f.id),
    }))

  // Group chats the user can request to join — ones a connection (someone they follow,
  // or who follows them) is a member of, and the user isn't already in.
  const [myChatSubs, follows] = await Promise.all([
    prisma.forumSubscription.findMany({ where: { userId: me, forum: { type: 'group_chat' } }, select: { forumId: true } }),
    prisma.follow.findMany({ where: { OR: [{ followerId: me }, { followingId: me }] }, select: { followerId: true, followingId: true } }),
  ])
  const myChatIds = new Set(myChatSubs.map(s => s.forumId))
  const connectedIds = new Set<string>()
  follows.forEach(f => connectedIds.add(f.followerId === me ? f.followingId : f.followerId))

  let connectedChats: { id: string; title: string; gymName: string | null; members: number; requested: boolean }[] = []
  if (connectedIds.size > 0) {
    const chatSubs = await prisma.forumSubscription.findMany({
      where: { userId: { in: [...connectedIds] }, forum: { type: 'group_chat' } },
      select: { forum: { select: { id: true, title: true, gym: { select: { name: true } }, _count: { select: { subscriptions: true } } } } },
    })
    const seen = new Set<string>()
    const candidates: { id: string; title: string; gymName: string | null; members: number }[] = []
    for (const s of chatSubs) {
      const c = s.forum
      if (myChatIds.has(c.id) || seen.has(c.id)) continue
      seen.add(c.id)
      candidates.push({ id: c.id, title: c.title, gymName: c.gym?.name ?? null, members: c._count.subscriptions })
    }
    const pendingReqs = candidates.length > 0
      ? await prisma.forumJoinRequest.findMany({ where: { userId: me, status: 'pending', forumId: { in: candidates.map(c => c.id) } }, select: { forumId: true } })
      : []
    const pendingSet = new Set(pendingReqs.map(r => r.forumId))
    connectedChats = candidates.map(c => ({ ...c, requested: pendingSet.has(c.id) }))
  }

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
        connectedChats={connectedChats}
        currentGym={user.gym ?? null}
      />

      <div className="mt-8 pt-6 border-t border-smoke">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Product Tour</p>
        <p className="text-sm text-slate mb-3">Replay the guided walkthrough of the app’s features anytime.</p>
        <TourReplayButton roles={tourRolesForUser(session.user.roles ?? [])} />
      </div>
    </div>
  )
}
