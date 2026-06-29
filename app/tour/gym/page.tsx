import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { TourRunner } from '../TourRunner'

export const metadata = { title: 'Gym Owner Tour' }

export default async function GymTourPage() {
  const session = await getServerSession(authOptions)
  const loggedIn = !!session?.user?.id
  let exitHref = '/'
  if (loggedIn) {
    const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { onboardingDone: true } })
    exitHref = user?.onboardingDone ? '/admin' : '/onboarding'
  }
  return <TourRunner role="gym" loggedIn={loggedIn} exitHref={exitHref} />
}
