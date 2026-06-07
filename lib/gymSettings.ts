import prisma from '@/lib/database'

// Per-gym settings (Phase 24.4). Always scope by gymId — there is one
// GymSettings row per gym (gymId is @unique).
export async function getGymSettings(gymId: string | null | undefined) {
  if (!gymId) return { reviewUrl: null }
  const settings = await prisma.gymSettings.findUnique({ where: { gymId } })
  return settings ?? { reviewUrl: null }
}
