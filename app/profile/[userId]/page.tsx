import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/database'
import Link from 'next/link'
import { BeltBadge } from '@/app/components/BeltBadge'
import { ShareButton } from './ShareButton'
import { FollowButton } from './FollowButton'
import { ProfilePosts, type ProfilePost } from './ProfilePosts'
import { PUBLIC_FORUM_TYPES } from '@/lib/feed'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  return { title: user?.name ?? 'Member Profile' }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  // No redirect if not logged in — unauthenticated visitors can see public fields
  const session = await getServerSession(authOptions)
  const { userId } = await params

  // Redirect own profile to /profile (only if logged in)
  if (session?.user?.id === userId) redirect('/profile')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      belt: true,
      stripes: true,
      beltVerified: true,
      weightClass: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      profilePrivacy: true,
      roles: true,
      providerStatus: true,
      providerBio: true,
      gym: { select: { name: true, slug: true } },
      _count: { select: { followers: true, following: true } },
      competitions: {
        orderBy: { date: 'desc' },
        select: { id: true, name: true, date: true, location: true, division: true, weightClass: true, result: true },
      },
      trainingReflection: {
        select: { whyStarted: true, challenges: true, goals: true, privacy: true },
      },
    },
  })

  if (!user) notFound()

  const isAdmin = session?.user?.roles?.includes('admin') ?? false
  const isAuthenticated = !!session
  const viewerId = session?.user?.id ?? null
  const viewerGymId = session?.user?.gymId ?? null
  const privacy = (user.profilePrivacy as Record<string, string>) ?? {}

  // Follow state for the current viewer
  const isFollowing = viewerId
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
      }))
    : false

  // Public post history (anyone) + restricted posts the viewer can see (same-gym forum)
  const postSelect = {
    id: true, content: true, createdAt: true,
    forum: { select: { id: true, title: true } },
  }
  const publicPostRows = await prisma.post.findMany({
    where: { authorId: userId, parentId: null, forum: { type: { in: [...PUBLIC_FORUM_TYPES] } } },
    orderBy: { createdAt: 'desc' }, take: 20, select: postSelect,
  })
  const extraPostRows = (viewerId && viewerGymId)
    ? await prisma.post.findMany({
        where: { authorId: userId, parentId: null, forum: { type: 'gym_forum', gymId: viewerGymId } },
        orderBy: { createdAt: 'desc' }, take: 20, select: postSelect,
      })
    : []
  const toVM = (p: typeof publicPostRows[number], restricted: boolean): ProfilePost => ({
    id: p.id, content: p.content, createdAt: p.createdAt.toISOString(),
    forumId: p.forum.id, forumTitle: p.forum.title, restricted,
  })
  const publicPosts = publicPostRows.map(p => toVM(p, false))
  const extraPosts = extraPostRows.map(p => toVM(p, true))

  function visible(field: string, defaultLevel = 'members') {
    if (isAdmin) return true
    const level = privacy[field] ?? defaultLevel
    if (level === 'public') return true
    if (level === 'members') return isAuthenticated
    return false // private
  }

  const profilePath = `/profile/${userId}`

  // Phase 57 — surface instructor/provider context on the one profile.
  const userRoles = (user.roles as string[]) ?? []
  const isClassInstructor = userRoles.includes('instructor') || userRoles.includes('admin')
  const isPrivateInstructor = user.providerStatus === 'approved'
  const offersLessons = isClassInstructor || isPrivateInstructor

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Member Profile</span>
          </div>
          <h1 className="font-display text-2xl text-ink">{user.name ?? 'Unknown'}</h1>
          {user.gym && (
            <p className="text-sm text-slate mt-1">
              <Link href={`/gyms/${user.gym.slug}`} className="hover:text-ink transition-colors">{user.gym.name}</Link>
            </p>
          )}
          <p className="text-xs text-ash mt-1">
            <span className="font-medium text-steel">{user._count.followers}</span> followers
            {' · '}
            <span className="font-medium text-steel">{user._count.following}</span> following
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && <FollowButton userId={userId} initialFollowing={isFollowing} />}
          <ShareButton url={profilePath} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar + belt */}
        <div className="border border-smoke bg-paper p-6 flex items-center gap-5">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name ?? 'Avatar'}
              className="w-16 h-16 rounded-full object-cover border border-smoke" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-mist border border-smoke flex items-center justify-center">
              <span className="font-display text-xl font-bold text-steel">
                {(user.name ?? '?')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BeltBadge belt={user.belt} stripes={user.stripes} />
              {user.beltVerified
                ? <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                : <span className="text-xs text-ash italic">Unverified</span>
              }
            </div>
            <p className="text-xs text-ash">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Offers private lessons (Phase 57) */}
        {offersLessons && (
          <div className="border border-smoke bg-paper p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-steel">Offers private lessons</p>
              <div className="flex items-center gap-2 flex-wrap">
                {isClassInstructor && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-mist text-steel">
                    Class Instructor{user.gym ? ` · ${user.gym.name}` : ''}
                  </span>
                )}
                {isPrivateInstructor && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-brand-red/10 text-brand-red">Private Instructor · vetted</span>
                )}
              </div>
            </div>
            {isPrivateInstructor && user.providerBio && (
              <p className="text-ink text-sm leading-relaxed mb-4">{user.providerBio}</p>
            )}
            {isAuthenticated && (
              <Link href={`/lessons/new?instructor=${userId}`} className="inline-block px-5 py-2.5 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors">
                Request a lesson
              </Link>
            )}
          </div>
        )}

        {/* Bio */}
        {user.bio && visible('bio') && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Bio</p>
            <p className="text-ink text-sm leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Competitions */}
        {user.competitions.length > 0 && visible('competitions') && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Competitions</p>
            <div className="flex flex-col gap-3">
              {user.competitions.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {c.location ? ` · ${c.location}` : ''}
                      {c.division ? ` · ${c.division}` : ''}
                    </p>
                  </div>
                  {c.result && (
                    <span className="text-xs font-bold text-brand-red shrink-0">{c.result}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Reflection */}
        {user.trainingReflection && (() => {
          const r = user.trainingReflection!
          const reflectionVisible = isAdmin ||
            r.privacy === 'public' ||
            (r.privacy === 'members' && isAuthenticated)
          if (!reflectionVisible) return null
          return (
            <div className="border border-smoke bg-paper p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Training Reflection</p>
              {r.whyStarted && (
                <div className="mb-4">
                  <p className="text-xs text-ash mb-1">Why I started training</p>
                  <p className="text-sm text-ink leading-relaxed">{r.whyStarted}</p>
                </div>
              )}
              {r.challenges && (
                <div className="mb-4">
                  <p className="text-xs text-ash mb-1">Challenges &amp; how I overcome them</p>
                  <p className="text-sm text-ink leading-relaxed">{r.challenges}</p>
                </div>
              )}
              {r.goals && (
                <div>
                  <p className="text-xs text-ash mb-1">Goals</p>
                  <p className="text-sm text-ink leading-relaxed">{r.goals}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Post history */}
        <ProfilePosts publicPosts={publicPosts} extraPosts={extraPosts} />
      </div>
    </div>
  )
}
