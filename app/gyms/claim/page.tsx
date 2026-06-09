import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClaimClient } from './ClaimClient'

export const metadata = { title: 'Claim your gym' }

export default async function ClaimGymPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/gyms/claim')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2"><Link href="/dashboard" className="text-xs text-ash hover:text-ink transition-colors">← Dashboard</Link></div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Claim a gym</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Is your gym already listed?</h1>
        <p className="text-slate text-sm mt-2">
          Find your gym below and claim it — once a site admin verifies you, you&apos;ll manage its schedule, forums, and roster.
          Members already affiliated with the listing carry over.
        </p>
      </div>
      <ClaimClient />
    </div>
  )
}
