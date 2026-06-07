import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'
import prisma from '@/lib/database'
import { AcceptInvite } from './AcceptInvite'

export const metadata = { title: 'You\'re Invited' }

export default async function InviteLandingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = await getServerSession(authOptions)

  const invite = await prisma.invitation.findUnique({
    where: { token },
    select: {
      kind: true, gymId: true, grantOnAccept: true, maxUses: true, usedCount: true, expiresAt: true,
      inviter: { select: { id: true, name: true } },
    },
  })

  const gym = invite?.gymId
    ? await prisma.gym.findUnique({ where: { id: invite.gymId }, select: { name: true } })
    : null

  const expired = invite?.expiresAt ? invite.expiresAt < new Date() : false
  const maxed = invite?.maxUses != null && invite.usedCount >= invite.maxUses
  const invalid = !invite || expired || maxed

  const inviterName = invite?.inviter.name ?? 'Someone'
  const kindLabel =
    invite?.kind === 'gym_instructor' ? `as an instructor at ${gym?.name ?? 'their gym'}`
    : invite?.kind === 'gym_member' ? `to join ${gym?.name ?? 'their gym'}`
    : 'to connect on AscendIt'

  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="border border-smoke bg-paper p-8 flex flex-col gap-5">
          <div className="inline-block bg-brand-red px-3 py-1 self-start">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Invitation</span>
          </div>

          {invalid ? (
            <>
              <h1 className="font-display text-2xl text-ink">This invite isn't available</h1>
              <p className="text-sm text-slate">
                {maxed ? 'This invite has already been used.' : expired ? 'This invite has expired.' : 'This invite link is invalid.'}
              </p>
              <Link href="/" className="text-sm text-brand-red hover:underline">Go to AscendIt →</Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl text-ink">{inviterName} invited you {kindLabel}</h1>
              {session?.user?.id ? (
                <AcceptInvite token={token} />
              ) : (
                <>
                  <p className="text-sm text-slate">Create your free account to accept.</p>
                  <Link
                    href={`/register?invite=${encodeURIComponent(token)}`}
                    className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors text-center"
                  >
                    Create account
                  </Link>
                  <p className="text-xs text-ash text-center">
                    Already have an account?{' '}
                    <Link href={`/login?invite=${encodeURIComponent(token)}`} className="text-ink font-medium hover:text-brand-red">Log in</Link> to accept.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
