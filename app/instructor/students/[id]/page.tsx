import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { BeltBadge } from '@/app/components/BeltBadge'
import { NotesClient } from './NotesClient'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

export default async function InstructorStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  const { id } = await params

  const student = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, belt: true, stripes: true,
      bio: true, phone: true, emergencyContact: true, avatarUrl: true, createdAt: true,
      studentNotes: {
        include: { instructor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      attendanceRecords: {
        include: { classSession: { select: { date: true, class: { select: { title: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      trainingLogs: {
        where: {
          isPrivate: false,
          classSession: { class: { instructorId: session.user.id } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, isGuided: true, createdAt: true,
          classSession: { select: { date: true, class: { select: { title: true } } } },
        },
      },
    },
  })

  if (!student) notFound()

  const notes = student.studentNotes.map(n => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    instructorName: n.instructorId === session.user.id ? 'You' : (n.instructor.name ?? 'Instructor'),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8 flex items-start gap-4">
        {student.avatarUrl ? (
          <img src={student.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-smoke" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-mist border border-smoke flex items-center justify-center flex-shrink-0">
            <span className="font-display text-lg font-bold text-steel">{(student.name ?? '?')[0].toUpperCase()}</span>
          </div>
        )}
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-2">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Member</span>
          </div>
          <h1 className="font-display text-2xl text-ink">{student.name ?? 'Unknown'}</h1>
          <div className="mt-1"><BeltBadge belt={student.belt as Belt} stripes={student.stripes} /></div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Contact */}
        <div className="border border-smoke bg-paper p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-ash">Email</p><p className="text-ink">{student.email}</p></div>
            {student.phone && <div><p className="text-xs text-ash">Phone</p><p className="text-ink">{student.phone}</p></div>}
            {student.emergencyContact && <div><p className="text-xs text-ash">Emergency</p><p className="text-ink">{student.emergencyContact}</p></div>}
          </div>
          {student.bio && (
            <div className="mt-3 pt-3 border-t border-smoke">
              <p className="text-xs text-ash mb-1">Bio</p>
              <p className="text-sm text-ink">{student.bio}</p>
            </div>
          )}
        </div>

        {/* Recent attendance */}
        {student.attendanceRecords.length > 0 && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Recent Attendance</p>
            <div className="flex flex-col gap-2">
              {student.attendanceRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <p className="text-sm text-ink">{r.classSession.class.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-ash">
                      {r.classSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </p>
                    <span className={`px-1.5 py-0.5 text-xs font-bold uppercase ${r.attended ? 'bg-green-100 text-green-700' : 'bg-mist text-ash'}`}>
                      {r.attended ? 'Present' : 'Absent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training logs (non-private only) */}
        {student.trainingLogs.length > 0 && (
          <div className="border border-smoke bg-paper p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-4">Training Journal</p>
            <div className="flex flex-col gap-2">
              {student.trainingLogs.map(log => (
                <Link
                  key={log.id}
                  href={`/journal/${log.id}`}
                  className="flex items-center justify-between text-sm hover:text-brand-red transition-colors"
                >
                  <span className="text-ink">
                    {log.classSession ? log.classSession.class.title : 'General Entry'}
                  </span>
                  <span className="text-xs text-ash">
                    {log.classSession
                      ? new Date(log.classSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
                      : new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{log.isGuided ? 'Guided' : 'Free-form'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <NotesClient studentId={student.id} initial={notes} />
      </div>
    </div>
  )
}
