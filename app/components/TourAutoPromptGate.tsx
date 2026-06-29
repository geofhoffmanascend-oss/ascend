import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { Role } from '@prisma/client'
import { primaryTourForUser, seenRoleFor } from '@/lib/tour'
import { TourAutoPrompt } from './TourAutoPrompt'

// Server gate: shows the one-time tour prompt only if the user's primary tour role
// hasn't been offered yet. Drop into a role's landing page.
export async function TourAutoPromptGate() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  let user: { tourSeenRoles: Role[] } | null = null
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tourSeenRoles: true },
    })
  } catch {
    return null // table/column not migrated yet — fail safe
  }

  const roles = session.user.roles ?? []
  const tour = primaryTourForUser(roles)
  const seen = (user?.tourSeenRoles ?? []).includes(seenRoleFor(tour) as Role)
  if (seen) return null

  return <TourAutoPrompt role={tour} />
}
