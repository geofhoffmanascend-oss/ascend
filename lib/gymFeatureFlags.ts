// Client-safe gym feature flag types, defaults, and labels (Phase 37).
// No DB import here so this can be imported by Client Components.
// Server-only read/write helpers live in lib/gymFeatures.ts.

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
