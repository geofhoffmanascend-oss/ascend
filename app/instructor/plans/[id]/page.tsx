import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { PlanForm } from '../PlanForm'

export default async function EditLessonPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'instructor' && session.user.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const plan = await prisma.lessonPlan.findUnique({ where: { id } })
  if (!plan || plan.instructorId !== session.user.id) notFound()

  const classes = await prisma.class.findMany({
    where: { instructorId: session.user.id, isActive: true },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  const videoUrls = plan.videoUrls ? JSON.parse(plan.videoUrls) : []

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/instructor/plans" className="text-xs text-ash hover:text-ink transition-colors">← Lesson Plans</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Edit Plan</span>
        </div>
        <h1 className="font-display text-2xl text-ink">{plan.title}</h1>
      </div>
      <PlanForm
        classes={classes}
        initial={{
          id: plan.id,
          title: plan.title,
          techniques: plan.techniques ?? '',
          notes: plan.notes ?? '',
          videoUrls,
          classId: plan.classId ?? '',
        }}
      />
    </div>
  )
}
