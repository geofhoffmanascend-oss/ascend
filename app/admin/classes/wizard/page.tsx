import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ClassWizard } from './ClassWizard'

export const metadata = { title: 'Add Classes' }

export default async function ClassWizardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  const gymId = session.user.gymId ?? null

  const [instructors, programs] = await Promise.all([
    prisma.user.findMany({
      where: { gymId, roles: { hasSome: ['instructor', 'admin'] } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    gymId
      ? prisma.classProgram.findMany({
          where: { gymId },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true },
        })
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
        <h1 className="font-display text-2xl text-ink">Add Classes</h1>
        <p className="text-slate text-sm mt-2">
          Pick the days a class runs — we'll create one class for each. Group your classes to keep the schedule organized and give each group its own forum for training partners.
        </p>
      </div>

      <ClassWizard instructors={instructors} programs={programs} />
    </div>
  )
}
