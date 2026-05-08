import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { PromoteForm } from './PromoteForm'

export default async function PromotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, belt: true, stripes: true },
  })
  if (!user) notFound()

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href={`/admin/users/${id}`} className="text-xs text-ash hover:text-ink transition-colors">← {user.name}</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Promotion</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Promote {user.name}</h1>
        <p className="text-ash text-sm mt-1">Current: {user.belt} belt, {user.stripes} stripe{user.stripes !== 1 ? 's' : ''}</p>
      </div>
      <PromoteForm studentId={user.id} currentBelt={user.belt} currentStripes={user.stripes} />
    </div>
  )
}
