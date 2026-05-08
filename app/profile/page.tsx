import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { GoalsSection } from './GoalsSection'
import { CompetitionsSection } from './CompetitionsSection'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      belt: true,
      stripes: true,
      weightClass: true,
      qrToken: true,
      bio: true,
      phone: true,
      emergencyContact: true,
      avatarUrl: true,
      createdAt: true,
      goalsAsStudent: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, description: true, targetDate: true, completedAt: true },
      },
      competitions: {
        orderBy: { date: 'desc' },
        select: { id: true, name: true, date: true, location: true, division: true, weightClass: true, result: true, notes: true },
      },
      lessonsRequested: {
        where: { status: 'completed' },
        orderBy: { scheduledAt: 'desc' },
        select: { id: true, scheduledAt: true, durationMins: true, instructor: { select: { name: true } } },
      },
    },
  })

  if (!user) redirect('/login')

  const goals = user.goalsAsStudent.map(g => ({
    ...g,
    targetDate: g.targetDate ? g.targetDate.toISOString() : null,
    completedAt: g.completedAt ? g.completedAt.toISOString() : null,
  }))

  const competitions = user.competitions.map(c => ({
    ...c,
    date: c.date.toISOString(),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
              Profile
            </span>
          </div>
          <h1 className="font-display text-2xl text-ink">{user.name ?? 'No name set'}</h1>
        </div>
        <Link
          href="/profile/edit"
          className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar + belt */}
        <div className="border border-smoke bg-paper p-6 flex items-center gap-5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ?? 'Avatar'}
              className="w-16 h-16 rounded-full object-cover border border-smoke"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-mist border border-smoke flex items-center justify-center">
              <span className="font-display text-xl font-bold text-steel">
                {(user.name ?? '?')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <BeltBadge belt={user.belt} stripes={user.stripes} />
            {user.weightClass && (
              <p className="text-xs text-steel font-medium">{user.weightClass}</p>
            )}
            <p className="text-xs text-ash">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Bio</p>
          {user.bio ? (
            <p className="text-ink text-sm leading-relaxed">{user.bio}</p>
          ) : (
            <p className="text-ash text-sm italic">
              No bio yet.{' '}
              <Link href="/profile/edit" className="underline hover:text-ink">Add one.</Link>
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ash uppercase tracking-wider mb-1">Email</p>
              <p className="text-ink text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-ash uppercase tracking-wider mb-1">Phone</p>
              <p className="text-ink text-sm">{user.phone ?? <span className="text-ash italic">Not set</span>}</p>
            </div>
            <div>
              <p className="text-xs text-ash uppercase tracking-wider mb-1">Emergency Contact</p>
              <p className="text-ink text-sm">{user.emergencyContact ?? <span className="text-ash italic">Not set</span>}</p>
            </div>
          </div>
        </div>

        {/* QR check-in code */}
        <div className="border border-smoke bg-paper p-6 flex flex-col items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-steel self-start">Check-in QR Code</p>
          <QRCodeDisplay token={user.qrToken} />
        </div>

        <GoalsSection goals={goals} />
        <CompetitionsSection competitions={competitions} />

        {/* Lesson history */}
        {user.lessonsRequested.length > 0 && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Private Lesson History</p>
            <div className="flex flex-col gap-3">
              {user.lessonsRequested.map(l => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink">with {l.instructor.name}</p>
                    <p className="text-xs text-ash mt-0.5">
                      {new Date(l.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {' · '}{l.durationMins} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
