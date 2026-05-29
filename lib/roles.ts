import type { Session } from 'next-auth'

export type AppRole = 'admin' | 'instructor' | 'student' | 'vendor' | 'site_admin'

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
