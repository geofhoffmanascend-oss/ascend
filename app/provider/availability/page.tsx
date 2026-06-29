import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { AvailabilityEditor } from '@/app/instructor/availability/AvailabilityEditor'

export const metadata = { title: 'My Availability' }

export default async function ProviderAvailabilityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/provider/availability')

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { providerStatus: true } })
  if (me?.providerStatus !== 'approved') redirect('/provider')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2"><Link href="/provider" className="text-xs text-ash hover:text-ink transition-colors">← Provider</Link></div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Private Instructor</span>
        </div>
        <h1 className="font-display text-2xl text-ink">My availability</h1>
        <p className="text-slate text-sm mt-2">Set when you&apos;re available for private lessons. Students nearby can request these slots.</p>
      </div>
      <AvailabilityEditor />
    </div>
  )
}
