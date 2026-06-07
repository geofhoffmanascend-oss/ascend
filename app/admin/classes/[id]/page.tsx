import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ClassForm } from '../ClassForm'

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  const { id } = await params
  const cls = await prisma.class.findUnique({ where: { id } })
  if (!cls) notFound()

  // Multi-tenancy: a gym admin may only edit classes in their own gym (site_admin bypasses).
  const isSiteAdmin = session.user.roles?.includes('site_admin')
  if (!isSiteAdmin && cls.gymId !== session.user.gymId) notFound()

  const gymId = session.user.gymId ?? null
  const [instructors, programs] = await Promise.all([
    prisma.user.findMany({
      where: { gymId, roles: { hasSome: ['instructor', 'admin'] } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    gymId
      ? prisma.classProgram.findMany({ where: { gymId }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true } })
      : Promise.resolve([]),
  ])

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin/classes" className="text-xs text-ash hover:text-ink transition-colors">← Classes</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Edit Class</h1>
      </div>
      <ClassForm
        instructors={instructors}
        programs={programs}
        initial={{
          id: cls.id,
          title: cls.title,
          type: cls.type,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          location: cls.location ?? '',
          instructorId: cls.instructorId,
          maxStudents: cls.maxStudents ? String(cls.maxStudents) : '',
          isActive: cls.isActive,
          programId: cls.programId ?? '',
        }}
      />
    </div>
  )
}
