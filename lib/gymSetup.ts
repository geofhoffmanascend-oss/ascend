import prisma from './database'
import { GYM_SETUP_DEFAULTS, type GymSetupProgress } from './gymSetupItems'

// Phase 38.3 — owner setup checklist completion, persisted in Gym.setupProgress (Json?).
// A missing/null value means nothing is done yet.
// Client-safe types/constants/items live in lib/gymSetupItems.ts and are re-exported
// here so existing server-side importers keep working.
export { GYM_SETUP_DEFAULTS, GYM_SETUP_ITEMS, isSetupComplete, type GymSetupProgress } from './gymSetupItems'

function coerce(raw: unknown): GymSetupProgress {
  const v = (raw ?? {}) as Record<string, unknown>
  return {
    schedule: v.schedule === true,
    instructors: v.instructors === true,
    logo: v.logo === true,
    roster: v.roster === true,
  }
}

export async function getGymSetup(gymId: string | null | undefined): Promise<GymSetupProgress> {
  if (!gymId) return { ...GYM_SETUP_DEFAULTS }
  const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { setupProgress: true } })
  return coerce(gym?.setupProgress)
}

export async function updateGymSetup(
  gymId: string,
  patch: Partial<GymSetupProgress>,
): Promise<GymSetupProgress> {
  const current = await getGymSetup(gymId)
  const next = { ...current, ...patch }
  await prisma.gym.update({ where: { id: gymId }, data: { setupProgress: next } })
  return next
}
