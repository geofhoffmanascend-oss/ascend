import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ProgramsClient } from './ProgramsClient'

export const metadata = { title: 'Class Programs' }

export default async function AdminProgramsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!session.user.roles?.includes('admin')) redirect('/dashboard')

  const gymId = session.user.gymId ?? null
  const programs = gymId
    ? await prisma.classProgram.findMany({
        where: { gymId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { classes: true } } },
      })
    : []

  const initial = programs.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    classCount: p._count.classes,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/admin/classes" className="text-xs text-ash hover:text-ink transition-colors">← Classes</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Class Programs</h1>
        <p className="text-slate text-sm mt-2">
          Group classes into programs (e.g. Basics, Advanced, Comp Team). Assign classes to a program in the class wizard.
        </p>
      </div>

      <ProgramsClient initial={initial} />
    </div>
  )
}
