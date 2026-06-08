import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AvailabilityEditor } from './AvailabilityEditor'

export const metadata = { title: 'Private Lesson Availability' }

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const roles = session.user.roles ?? []
  if (!roles.includes('instructor') && !roles.includes('admin')) redirect('/dashboard')

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor" className="text-xs text-ash hover:text-ink transition-colors">← Instructor</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Private Lesson Availability</h1>
        <p className="text-slate text-sm mt-2">Set when you're available for private lessons. Members can request times inside these windows.</p>
      </div>
      <AvailabilityEditor />
    </div>
  )
}
