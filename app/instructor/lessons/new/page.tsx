import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NewLessonForm } from './NewLessonForm'

export default async function NewInstructorLessonPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('instructor') && !session.user.roles?.includes('admin')) redirect('/dashboard')

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor/lessons" className="text-xs text-ash hover:text-ink transition-colors">← Lessons</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Schedule Private Lesson</h1>
        <p className="text-ash text-sm mt-1">Create a lesson for up to 2 students. They will be notified automatically.</p>
      </div>
      <NewLessonForm />
    </div>
  )
}
