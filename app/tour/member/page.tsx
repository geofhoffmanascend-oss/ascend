import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { TourRunner } from '../TourRunner'

export const metadata = { title: 'Member Tour' }

export default async function MemberTourPage() {
  const session = await getServerSession(authOptions)
  const loggedIn = !!session?.user?.id
  // If the user started the tour mid-onboarding, return them to the wizard, not the dashboard.
  let exitHref = '/'
  if (loggedIn) {
    const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { onboardingDone: true } })
    exitHref = user?.onboardingDone ? '/dashboard' : '/onboarding'
  }
  return <TourRunner role="member" loggedIn={loggedIn} exitHref={exitHref} />
}
