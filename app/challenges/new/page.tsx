import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { ChallengeForm } from './ChallengeForm'

export const metadata = { title: 'New Challenge' }

export default async function NewChallengePage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const { to } = await searchParams
  if (!to) redirect('/challenges')

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { acceptsChallenges: true } })
  const opponent = await prisma.user.findUnique({ where: { id: to }, select: { id: true, name: true, acceptsChallenges: true } })

  if (!opponent || to === session.user.id) {
    return <Notice msg="That member can't be challenged." />
  }
  if (!me?.acceptsChallenges) {
    return <Notice msg="Turn on “Accept challenge matches” in Settings before sending a challenge." link={{ href: '/settings', label: 'Go to Settings' }} />
  }
  if (!opponent.acceptsChallenges) {
    return <Notice msg={`${opponent.name ?? 'That member'} is not accepting challenges right now.`} />
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href={`/profile/${opponent.id}`} className="text-sm text-slate hover:text-ink">← Profile</Link>
      <h1 className="font-display text-2xl font-bold text-ink mt-3 mb-1">Challenge {opponent.name ?? 'member'}</h1>
      <p className="text-sm text-slate mb-6">Propose terms. They can accept, counter, or decline. Both of you sign the host gym&apos;s waiver and the gym approves before it&apos;s scheduled.</p>
      <ChallengeForm opponentId={opponent.id} opponentName={opponent.name ?? 'member'} />
    </div>
  )
}

function Notice({ msg, link }: { msg: string; link?: { href: string; label: string } }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-slate">{msg}</p>
      {link && <Link href={link.href} className="inline-block mt-4 text-sm font-bold text-brand-red">{link.label}</Link>}
    </div>
  )
}
