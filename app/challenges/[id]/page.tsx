import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getRuleset } from '@/lib/rulesets'
import { canRespond, canWithdraw, isParty, waiverStateFor } from '@/lib/challenge'
import { ChallengeDetailClient } from './ChallengeDetailClient'

export const metadata = { title: 'Challenge' }

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const { id } = await params
  const uid = session.user.id

  const c = await prisma.challengeMatch.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, name: true } },
      challenged: { select: { id: true, name: true } },
      hostGym: { select: { id: true, name: true } },
    },
  })
  if (!c) notFound()

  const roles = session.user.roles ?? []
  const isHostAdmin = (!!c.hostGymId && roles.includes('admin') && session.user.gymId === c.hostGymId) || roles.includes('site_admin')
  if (!isParty(c, uid) && !isHostAdmin) notFound()

  const lite = { id: c.id, challengerId: c.challengerId, challengedId: c.challengedId, status: c.status, lastActorId: c.lastActorId, expiresAt: c.expiresAt }
  const { waiver, signed } = isParty(c, uid)
    ? await waiverStateFor(c.id, c.hostGymId, uid)
    : { waiver: null, signed: false }

  const table = await prisma.matchTable.findFirst({ where: { challengeId: c.id }, select: { id: true, publicSlug: true } })

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/challenges" className="text-sm text-slate hover:text-ink">← Challenges</Link>
      <ChallengeDetailClient
        viewerId={uid}
        isHostAdmin={isHostAdmin}
        canRespond={isParty(c, uid) && canRespond(lite, uid)}
        canWithdraw={isParty(c, uid) && canWithdraw(lite, uid)}
        waiver={waiver ? { id: waiver.id, title: waiver.title, body: waiver.body, fileUrl: waiver.fileUrl, version: waiver.version, signed } : null}
        table={table}
        challenge={{
          id: c.id,
          status: c.status,
          challenger: c.challenger,
          challenged: c.challenged,
          hostGym: c.hostGym,
          rulesetName: getRuleset(c.rulesetId)?.name ?? 'Custom',
          rulesetId: c.rulesetId,
          periodMs: c.periodMs,
          scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
          location: c.location,
          message: c.message,
          lastActorId: c.lastActorId,
          winnerId: c.winnerId,
          winBy: c.winBy,
        }}
      />
    </div>
  )
}
