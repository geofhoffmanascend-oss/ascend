import type { Session } from 'next-auth'

export type AppRole = 'admin' | 'instructor' | 'student' | 'vendor' | 'site_admin'

// Display labels for roles. The internal `student` role is shown as "Member"
// everywhere — everyone is a member; owners/instructors are members too.
export const ROLE_LABELS: Record<string, string> = {
  student: 'Member',
  instructor: 'Instructor',
  vendor: 'Vendor',
  admin: 'Admin',
  site_admin: 'Site Admin',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export function formatRoles(roles: string[]): string {
  return roles.map(roleLabel).join(', ')
}

export function hasRole(session: Session | null, role: AppRole): boolean {
  return session?.user?.roles?.includes(role) ?? false
}

export function hasAnyRole(session: Session | null, roles: AppRole[]): boolean {
  return roles.some(r => hasRole(session, r))
}

export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'admin')
}

export function isInstructor(session: Session | null): boolean {
  return hasAnyRole(session, ['instructor', 'admin'])
}

export function isVendor(session: Session | null): boolean {
  return hasAnyRole(session, ['vendor', 'admin'])
}

export function isSiteAdmin(session: Session | null): boolean {
  return hasRole(session, 'site_admin')
}
