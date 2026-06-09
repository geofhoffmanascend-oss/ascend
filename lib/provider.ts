import type { ProviderStatus } from '@prisma/client'

// Phase 42.4 — independent (non-gym) private-lesson providers.

// Who may approve provider applications: a verified black belt, or a site admin.
export function isVerifiedBlackBelt(u: { belt?: string | null; beltVerified?: boolean | null }): boolean {
  return u.belt === 'black' && !!u.beltVerified
}

export function canApproveProviders(u: { belt?: string | null; beltVerified?: boolean | null; roles?: string[] | null }): boolean {
  return isVerifiedBlackBelt(u) || !!u.roles?.includes('site_admin')
}

export function isApprovedProvider(u: { providerStatus?: ProviderStatus | null }): boolean {
  return u.providerStatus === 'approved'
}

// Who may use the availability editor: gym instructors/admins, or approved providers.
export function canEditAvailability(roles: string[] | undefined | null, providerStatus: ProviderStatus | null | undefined): boolean {
  const isInstructor = !!roles && (roles.includes('instructor') || roles.includes('admin'))
  return isInstructor || providerStatus === 'approved'
}
