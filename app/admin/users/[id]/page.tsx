import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { RoleManager } from './RoleManager'
import { ClassAccessManager } from './ClassAccessManager'
import { EmailActions } from './EmailActions'
import { BeltVerification } from './BeltVerification'
import { ClassGroup } from '@prisma/client'
import { roleLabel } from '@/lib/roles'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      attendanceRecords: {
        include: { classSession: { select: { date: true, class: { select: { title: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      rankHistory: {
        include: { promotedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      studentNotes: {
        include: { instructor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) notFound()

  // Multi-tenancy: a gym admin may only view users in their own gym (site_admin bypasses).
  const isSiteAdmin = session.user.roles?.includes('site_admin')
  if (!isSiteAdmin && user.gymId !== session.user.gymId) notFound()

  const verifier = user.beltVerifiedBy
    ? await prisma.user.findUnique({ where: { id: user.beltVerifiedBy }, select: { name: true } })
    : null

  // Phase 52.5 — the gym's class groups for the access toggles (falls back to
  // the legacy fixed groups when the gym hasn't defined any).
  const classGroups = session.user.gymId
    ? await prisma.classProgram.findMany({
        where: { gymId: session.user.gymId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, description: true },
      })
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin/users" className="text-xs text-ash hover:text-ink transition-colors">← Users</Link>
      </div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin · User</span>
          </div>
          <h1 className="font-display text-2xl text-ink">{user.name ?? '(no name)'}</h1>
          <p className="text-ash text-sm mt-1">{user.email}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(user.roles as string[]).map((r: string) => (
              <span key={r} className="text-xs px-2 py-0.5 bg-mist text-steel font-medium">{roleLabel(r)}</span>
            ))}
          </div>
          <div className="mt-2"><BeltBadge belt={user.belt as Belt} stripes={user.stripes} /></div>
        </div>
        <Link
          href={`/admin/users/${user.id}/promote`}
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
        >
          Promote
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-ash whitespace-nowrap">Admin Controls</p>
          <div className="h-px flex-1 bg-smoke" />
        </div>

        {/* Role Management */}
        <RoleManager userId={user.id} currentRoles={user.roles as string[]} />

        {/* Class Access */}
        <ClassAccessManager
          userId={user.id}
          blocked={user.blockedClassGroups as ClassGroup[]}
          programs={classGroups}
          blockedProgramIds={(user.blockedProgramIds ?? []) as string[]}
        />

        {/* Email / Account Actions */}
        <EmailActions userId={user.id} currentEmail={user.email ?? ''} />

        {/* Belt Verification */}
        <BeltVerification
          userId={user.id}
          userName={user.name ?? 'this user'}
          belt={user.belt}
          initialVerified={user.beltVerified}
          verifierName={verifier?.name ?? null}
        />

        <div className="flex items-center gap-3 mt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-ash whitespace-nowrap">Profile &amp; History</p>
          <div className="h-px flex-1 bg-smoke" />
        </div>

        {/* Contact */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-ash">Email</p><p className="text-ink">{user.email}</p></div>
            {user.phone && <div><p className="text-xs text-ash">Phone</p><p className="text-ink">{user.phone}</p></div>}
            {user.emergencyContact && <div><p className="text-xs text-ash">Emergency</p><p className="text-ink">{user.emergencyContact}</p></div>}
            <div><p className="text-xs text-ash">Joined</p><p className="text-ink">{user.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
          </div>
        </div>

        {/* Rank history */}
        {user.rankHistory.length > 0 && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Rank History</p>
            <div className="flex flex-col gap-3">
              {user.rankHistory.map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BeltBadge belt={r.belt as Belt} stripes={r.stripes} />
                    {r.notes && <p className="text-xs text-ash">{r.notes}</p>}
                  </div>
                  <p className="text-xs text-ash">
                    {r.promotedBy.name} · {r.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance */}
        {user.attendanceRecords.length > 0 && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">
              Recent Attendance ({user.attendanceRecords.filter(r => r.attended).length}/{user.attendanceRecords.length} present)
            </p>
            <div className="flex flex-col gap-2">
              {user.attendanceRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <p className="text-sm text-ink">{r.classSession.class.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-ash">{r.classSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                    <span className={`px-1.5 py-0.5 text-xs font-bold uppercase ${r.attended ? 'bg-green-100 text-green-700' : 'bg-mist text-ash'}`}>
                      {r.attended ? 'Present' : 'Absent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructor notes */}
        {user.studentNotes.length > 0 && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Instructor Notes</p>
            <div className="flex flex-col gap-3">
              {user.studentNotes.map(n => (
                <div key={n.id}>
                  <p className="text-sm text-ink">{n.content}</p>
                  <p className="text-xs text-ash mt-0.5">
                    {n.instructor.name} · {n.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
