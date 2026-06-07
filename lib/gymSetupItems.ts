// Phase 38.3 — client-safe types/constants for the owner setup checklist.
// No prisma import here so it can be used from client components (mirrors the
// gymFeatures.ts / gymFeatureFlags.ts split).

export type GymSetupProgress = {
  schedule: boolean
  instructors: boolean
  logo: boolean
  roster: boolean
}

export const GYM_SETUP_DEFAULTS: GymSetupProgress = {
  schedule: false,
  instructors: false,
  logo: false,
  roster: false,
}

export const GYM_SETUP_ITEMS: { key: keyof GymSetupProgress; title: string; desc: string; href: string }[] = [
  { key: 'schedule', title: 'Add your class schedule', desc: 'Create recurring classes so members can register and check in.', href: '/admin/classes' },
  { key: 'instructors', title: 'Add or invite instructors', desc: 'Assign the instructor role to your coaches.', href: '/admin/users' },
  { key: 'logo', title: 'Upload your gym logo', desc: 'Brand your gym page and forums.', href: '/admin/settings' },
  { key: 'roster', title: 'Build your student roster', desc: 'Review members and assign roles. Bulk import coming soon.', href: '/admin/users' },
]

export function isSetupComplete(p: GymSetupProgress): boolean {
  return p.schedule && p.instructors && p.logo && p.roster
}
