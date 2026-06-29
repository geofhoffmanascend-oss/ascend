import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { canApproveProviders } from '@/lib/provider'
import { ApprovalsClient } from './ApprovalsClient'

export const metadata = { title: 'Private Instructor Applications' }

export default async function ProviderApprovalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { belt: true, beltVerified: true, roles: true },
  })
  if (!me || !canApproveProviders(me)) redirect('/provider')

  const applications = await prisma.user.findMany({
    where: { providerStatus: 'pending' },
    select: {
      id: true, name: true, belt: true, beltVerified: true,
      providerBio: true, providerCity: true, providerState: true,
      providerApplication: {
        select: {
          fullName: true, dateOfBirth: true, contactEmail: true, contactPhone: true,
          instructorName: true, instructorContact: true, gymName: true,
          countiesLived: true, arrestLast5: true, arrestDetails: true, consent: true,
        },
      },
    },
    orderBy: { providerApprovedAt: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2"><Link href="/provider" className="text-xs text-ash hover:text-ink transition-colors">← Private Instructor</Link></div>
      <h1 className="font-display text-2xl text-ink mb-1">Private instructor applications</h1>
      <p className="text-slate text-sm mb-6">Private instructors must be approved by a verified black belt before they can offer private lessons.</p>
      <ApprovalsClient applications={applications} />
    </div>
  )
}
