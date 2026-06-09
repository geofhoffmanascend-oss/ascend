import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { canApproveProviders } from '@/lib/provider'
import { ProviderApply } from './ProviderApply'

export const metadata = { title: 'Offer Private Lessons' }

export default async function ProviderPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/provider')

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerStatus: true, belt: true, beltVerified: true, roles: true },
  })
  const status = me?.providerStatus ?? 'none'
  const canApprove = !!me && canApproveProviders(me)
  const pendingCount = canApprove ? await prisma.user.count({ where: { providerStatus: 'pending' } }) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2"><Link href="/lessons" className="text-xs text-ash hover:text-ink transition-colors">← Private Lessons</Link></div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Independent Provider</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Offer private lessons</h1>
        <p className="text-slate text-sm mt-2">
          You don&apos;t need to belong to a gym to teach private lessons on AscendIt. Apply below — a verified black belt
          reviews your application. Once approved, set your availability and students nearby can request lessons.
        </p>
      </div>

      {canApprove && (
        <Link href="/provider/approvals" className="block mb-6 border border-smoke bg-paper p-4 hover:border-steel transition-colors">
          <p className="text-sm font-medium text-ink">Review provider applications →</p>
          <p className="text-xs text-ash mt-0.5">{pendingCount} pending · you can approve as a verified black belt</p>
        </Link>
      )}

      {status === 'approved' ? (
        <div className="border border-smoke bg-paper p-6">
          <p className="text-sm font-medium text-ink mb-1">✓ You&apos;re an approved provider.</p>
          <p className="text-sm text-slate mb-4">Set your availability so students can book slots with you.</p>
          <Link href="/provider/availability" className="inline-block px-6 py-3 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors">Manage availability</Link>
        </div>
      ) : status === 'pending' ? (
        <div className="border border-smoke bg-paper p-6">
          <p className="text-sm font-medium text-ink">Application pending review.</p>
          <p className="text-sm text-slate mt-1">A verified black belt will review your application. You&apos;ll get a notification when it&apos;s decided.</p>
        </div>
      ) : (
        <>
          {status === 'rejected' && <p className="text-sm text-ash mb-3 italic">Your previous application wasn&apos;t approved. You can apply again below.</p>}
          <ProviderApply />
        </>
      )}
    </div>
  )
}
