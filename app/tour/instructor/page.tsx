import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { TourRunner } from '../TourRunner'

export const metadata = { title: 'Instructor Tour' }

export default async function InstructorTourPage() {
  const session = await getServerSession(authOptions)
  const loggedIn = !!session?.user?.id
  let exitHref = '/'
  if (loggedIn) {
    const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { onboardingDone: true } })
    exitHref = user?.onboardingDone ? '/instructor' : '/onboarding'
  }
  return <TourRunner role="instructor" loggedIn={loggedIn} exitHref={exitHref} />
}
