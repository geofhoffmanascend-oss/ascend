import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { getEffectiveFeatures } from '@/lib/features'
import { NewLessonForm } from './NewLessonForm'

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ instructor?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { instructor: initialInstructorId } = await searchParams

  const { privateLessons } = await getEffectiveFeatures(session)
  if (!privateLessons) redirect('/dashboard')

  // Default to the member's home gym instructors (Phase 42.3; radius search adds others).
  const gymId = session.user.gymId ?? null
  const [instructors, students] = await Promise.all([
    prisma.user.findMany({
      where: { gymId, roles: { hasSome: ['instructor', 'admin'] }, id: { not: session.user.id } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { gymId, roles: { has: 'student' }, id: { not: session.user.id } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  type Person = { id: string; name: string | null; note?: string }
  const instructorList: Person[] = instructors
  // If we arrived with a pre-selected instructor who isn't at this gym (came from
  // radius search — another gym's instructor or an independent provider), add them
  // so the dropdown shows who you're booking (Phase 42.9).
  if (initialInstructorId && !instructorList.some(i => i.id === initialInstructorId)) {
    const ext = await prisma.user.findUnique({
      where: { id: initialInstructorId },
      select: { id: true, name: true, providerStatus: true, gym: { select: { name: true } } },
    })
    if (ext) {
      const note = ext.providerStatus === 'approved' && !ext.gym ? 'Private Instructor'
        : ext.gym ? `${ext.gym.name}` : 'Outside your gym'
      instructorList.unshift({ id: ext.id, name: ext.name, note })
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/lessons" className="text-xs text-ash hover:text-ink transition-colors">← Lessons</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">New</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Request a Lesson</h1>
      </div>
      <NewLessonForm instructors={instructorList} students={students} initialInstructorId={initialInstructorId ?? ''} />
    </div>
  )
}
