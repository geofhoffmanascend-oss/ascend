import prisma from './database'

// Per-gym feature toggles (Phase 37). Mirror of lib/platformSettings.ts but
// scoped to a single gym. A missing row means all features are on.
export interface GymFeatureFlags {
  storeEnabled: boolean
  tournamentsEnabled: boolean
  galleryEnabled: boolean
  privateLessonsEnabled: boolean
  gymForumEnabled: boolean
  journalEnabled: boolean
}

export const GYM_FEATURE_DEFAULTS: GymFeatureFlags = {
  storeEnabled: true,
  tournamentsEnabled: true,
  galleryEnabled: true,
  privateLessonsEnabled: true,
  gymForumEnabled: true,
  journalEnabled: true,
}

// Labels for the admin settings UI, in display order.
export const GYM_FEATURE_LABELS: { key: keyof GymFeatureFlags; label: string; hint: string }[] = [
  { key: 'storeEnabled', label: 'Gear Store', hint: 'Browse and order gym merchandise.' },
  { key: 'tournamentsEnabled', label: 'Tournaments', hint: 'In-house tournaments and registration.' },
  { key: 'galleryEnabled', label: 'Gallery', hint: 'Photo/video gallery uploads.' },
  { key: 'privateLessonsEnabled', label: 'Private Lessons', hint: 'Request and schedule private lessons.' },
  { key: 'gymForumEnabled', label: 'Gym Forum', hint: 'Your gym’s private community forum.' },
  { key: 'journalEnabled', label: 'Training Journal', hint: 'Personal training log and reflections.' },
]

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
