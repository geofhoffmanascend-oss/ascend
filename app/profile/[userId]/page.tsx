import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { ShareButton } from './ShareButton'

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
  const privacy = (user.profilePrivacy as Record<string, string>) ?? {}

  function visible(field: string, defaultLevel = 'members') {
    if (isAdmin) return true
    const level = privacy[field] ?? defaultLevel
    if (level === 'public') return true
    if (level === 'members') return isAuthenticated
    return false // private
  }

  const profilePath = `/profile/${userId}`

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Member Profile</span>
          </div>
          <h1 className="font-display text-2xl text-ink">{user.name ?? 'Unknown'}</h1>
        </div>
        <ShareButton url={profilePath} />
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
            {user.weightClass && visible('weightClass') && <p className="text-xs text-steel font-medium">{user.weightClass}</p>}
            <p className="text-xs text-ash">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

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
      </div>
    </div>
  )
}
