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

  // Default to the member's home gym instructors (Phase 42.3; global radius search comes later).
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
      <NewLessonForm instructors={instructors} students={students} initialInstructorId={initialInstructorId ?? ''} />
    </div>
  )
}
