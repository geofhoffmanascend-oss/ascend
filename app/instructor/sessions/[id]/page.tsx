import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { AttendanceClient } from './AttendanceClient'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi', nogi: 'No-Gi', open_mat: 'Open Mat', kids: 'Kids',
  competition_prep: 'Comp Prep', seminar: 'Seminar', fundamentals: 'Fundamentals',
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'instructor' && session.user.role !== 'admin') redirect('/dashboard')

  const { id } = await params

  const cs = await prisma.classSession.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true, title: true, type: true, startTime: true, endTime: true,
          location: true, instructorId: true,
          instructor: { select: { name: true } },
        },
      },
      commitments: {
        include: { user: { select: { id: true, name: true, belt: true, stripes: true } } },
        orderBy: { createdAt: 'asc' },
      },
      attendance: { select: { userId: true, attended: true } },
    },
  })

  if (!cs) notFound()
  if (session.user.role !== 'admin' && cs.class.instructorId !== session.user.id) redirect('/instructor')

  // 4.7 — students who attended before but haven't committed this session
  const committedIds = new Set(cs.commitments.map(c => c.userId))
  const regularAbsentees = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(committedIds) },
      attendanceRecords: {
        some: { classSession: { classId: cs.classId } },
      },
    },
    select: { id: true, name: true, belt: true },
    take: 10,
  })

  const dateLabel = cs.date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Session</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{cs.class.title}</h1>
        <p className="text-ash text-sm mt-1">
          {dateLabel} · {cs.class.startTime}–{cs.class.endTime}
          {cs.class.location && ` · ${cs.class.location}`}
        </p>
        <p className="text-xs text-ash mt-0.5">{TYPE_LABELS[cs.class.type] ?? cs.class.type}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="border border-smoke bg-paper p-6">
          <AttendanceClient
            sessionId={id}
            committed={cs.commitments.map(c => ({ userId: c.user.id, name: c.user.name ?? 'Unknown' }))}
            existing={cs.attendance}
          />
        </div>

        {/* Committed roster */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">
            Committed ({cs.commitments.length})
          </p>
          {cs.commitments.length === 0 ? (
            <p className="text-ash text-sm italic">No one committed.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {cs.commitments.map(c => (
                <Link
                  key={c.id}
                  href={`/instructor/students/${c.user.id}`}
                  className="flex items-center gap-3 hover:text-brand-red transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-mist border border-smoke flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-steel">{(c.user.name ?? '?')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm text-ink">{c.user.name}</p>
                    <BeltBadge belt={c.user.belt as Belt} stripes={c.user.stripes} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4.7 — Reach-out prompt */}
      {regularAbsentees.length > 0 && (
        <div className="mt-6 border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Haven't Committed</p>
          <p className="text-xs text-ash mb-4">These students have attended this class before but aren't committed this session.</p>
          <div className="flex flex-wrap gap-3">
            {regularAbsentees.map(u => (
              <Link
                key={u.id}
                href={`/instructor/students/${u.id}`}
                className="flex items-center gap-2 border border-smoke bg-mist px-3 py-2 hover:border-steel transition-colors"
              >
                <span className="text-sm text-ink">{u.name}</span>
                <BeltBadge belt={u.belt as Belt} stripes={0} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {cs.notes && (
        <div className="mt-6 border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">Session Notes</p>
          <p className="text-sm text-ink">{cs.notes}</p>
        </div>
      )}
    </div>
  )
}
