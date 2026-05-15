import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  return { title: user?.name ?? 'Member Profile' }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { userId } = await params

  // Own profile → redirect to /profile
  if (userId === session.user.id) redirect('/profile')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      belt: true,
      stripes: true,
      weightClass: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      profilePrivacy: true,
      competitions: {
        orderBy: { date: 'desc' },
        select: { id: true, name: true, date: true, location: true, division: true, weightClass: true, result: true },
      },
    },
  })

  if (!user) notFound()

  const isAdmin = session.user.roles?.includes('admin') ?? false
  const privacy = (user.profilePrivacy as Record<string, string>) ?? {}

  function visible(field: string, defaultLevel: 'members' | 'private' = 'members') {
    if (isAdmin) return true
    const level = privacy[field] ?? defaultLevel
    return level !== 'private'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Member Profile</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{user.name ?? 'Unknown'}</h1>
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
            <BeltBadge belt={user.belt} stripes={user.stripes} />
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
      </div>
    </div>
  )
}
