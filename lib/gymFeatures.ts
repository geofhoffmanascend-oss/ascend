import prisma from './database'
import { GYM_FEATURE_DEFAULTS, type GymFeatureFlags } from './gymFeatureFlags'

// Per-gym feature toggles (Phase 37). Mirror of lib/platformSettings.ts but
// scoped to a single gym. A missing row means all features are on.
// Client-safe types/constants/labels live in lib/gymFeatureFlags.ts and are
// re-exported here so existing server-side importers keep working.
export { GYM_FEATURE_DEFAULTS, GYM_FEATURE_LABELS, type GymFeatureFlags } from './gymFeatureFlags'

export async function getGymFeatures(gymId: string | null | undefined): Promise<GymFeatureFlags> {
  if (!gymId) return { ...GYM_FEATURE_DEFAULTS }
  const row = await prisma.gymFeatures.findUnique({ where: { gymId } })
  if (!row) return { ...GYM_FEATURE_DEFAULTS }
  return {
    storeEnabled: row.storeEnabled,
    tournamentsEnabled: row.tournamentsEnabled,
    galleryEnabled: row.galleryEnabled,
    privateLessonsEnabled: row.privateLessonsEnabled,
    gymForumEnabled: row.gymForumEnabled,
    journalEnabled: row.journalEnabled,
  }
}

export async function upsertGymFeatures(
  gymId: string,
  flags: Partial<GymFeatureFlags>,
): Promise<GymFeatureFlags> {
  const row = await prisma.gymFeatures.upsert({
    where: { gymId },
    create: { gymId, ...GYM_FEATURE_DEFAULTS, ...flags },
    update: flags,
  })
  return {
    storeEnabled: row.storeEnabled,
    tournamentsEnabled: row.tournamentsEnabled,
    galleryEnabled: row.galleryEnabled,
    privateLessonsEnabled: row.privateLessonsEnabled,
    gymForumEnabled: row.gymForumEnabled,
    journalEnabled: row.journalEnabled,
  }
}
