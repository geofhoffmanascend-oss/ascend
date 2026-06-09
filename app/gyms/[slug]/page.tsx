import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'
import prisma from '@/lib/database'
import { JoinButton } from './JoinButton'
import { GymForumPrompt } from '@/app/components/GymForumPrompt'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const gym = await prisma.gym.findUnique({ where: { slug }, select: { name: true } })
  return { title: gym?.name ?? 'Gym Profile' }
}

export default async function GymProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const session = await getServerSession(authOptions)

  const gym = await prisma.gym.findUnique({ where: { slug } })
  if (!gym) notFound()

  const [memberCount, membership, gymForum, gymAdmin] = await Promise.all([
    prisma.gymMembership.count({ where: { gymId: gym.id, status: 'active' } }),
    session?.user?.id
      ? prisma.gymMembership.findUnique({
          where: { userId_gymId: { userId: session.user.id, gymId: gym.id } },
          select: { status: true },
        })
      : Promise.resolve(null),
    prisma.forum.findFirst({
      where: { gymId: gym.id, type: 'gym_forum' },
      select: { id: true, title: true, _count: { select: { posts: true, subscriptions: true } } },
    }),
    // Phase 39 — a gym is "claimed" once it has an admin user.
    prisma.user.findFirst({ where: { gymId: gym.id, roles: { has: 'admin' } }, select: { id: true } }),
  ])
  const gymForumTyped = gymForum as typeof gymForum & { _count: { posts: number; subscriptions: number } } | null

  const isActiveMember = membership?.status === 'active'
  const isClaimed = !!gymAdmin

  return (
    <div className="min-h-full bg-paper py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border border-smoke bg-paper p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            {gym.logoUrl && (
              <img
                src={gym.logoUrl}
                alt={gym.name}
                className="w-20 h-20 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-display text-2xl font-bold text-ink">{gym.name}</h1>
                {gym.participatingStatus === 'participating' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 text-xs font-medium text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Participating
                  </span>
                )}
              </div>
              {gym.headInstructorName && (
                <p className="text-xs font-bold uppercase tracking-widest text-steel">
                  Head Instructor: <span className="normal-case font-normal tracking-normal text-ink">{gym.headInstructorName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3 border-t border-smoke pt-5 mb-6">
            {(gym.city || gym.state || gym.zip) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Location</p>
                <p className="text-sm text-ink">
                  {[gym.address, [gym.city, gym.state].filter(Boolean).join(', '), gym.zip].filter(Boolean).join(' · ')}
                </p>
              </div>
            )}
            {gym.phone && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Phone</p>
                <p className="text-sm text-ink">{gym.phone}</p>
              </div>
            )}
            {gym.website && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Website</p>
                <a href={gym.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-red hover:underline break-all">
                  {gym.website}
                </a>
              </div>
            )}
            {gym.description && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">About</p>
                <p className="text-sm text-ink whitespace-pre-line">{gym.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-0.5">Members on AscendIt</p>
              <p className="text-sm text-ink">{memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
            </div>
          </div>

          {/* Join action */}
          {session?.user?.id && (
            <JoinButton
              gymId={gym.id}
              isMember={!!membership}
              membershipStatus={membership?.status}
            />
          )}

          {/* Phase 39 — claim CTA for an unclaimed listing */}
          {session?.user?.id && !isClaimed && (
            <p className="mt-4 text-xs text-ash">
              Is this your gym?{' '}
              <Link href="/gyms/claim" className="text-brand-red font-semibold hover:underline">Claim it</Link>{' '}
              to manage its schedule, forums, and roster.
            </p>
          )}

          {/* Forum section — authenticated active members only */}
          {session?.user?.id && isActiveMember && (
            <div className="mt-6 pt-6 border-t border-smoke">
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Community Forum</p>
              {gymForumTyped ? (
                <Link
                  href={`/forum/${gymForumTyped.id}`}
                  className="border border-smoke bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{gymForumTyped.title ?? `${gym.name} Community`}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {gymForumTyped._count.subscriptions} {gymForumTyped._count.subscriptions === 1 ? 'member' : 'members'} · {gymForumTyped._count.posts} posts
                    </p>
                  </div>
                  <span className="text-xs text-ash flex-shrink-0 ml-4">→</span>
                </Link>
              ) : (
                <GymForumPrompt
                  gymId={gym.id}
                  gymName={gym.name}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
