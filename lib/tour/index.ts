import type { TourConfig, TourRole } from './types'
import { memberSteps } from './memberTour'
import { gymSteps } from './gymTour'
import { instructorSteps } from './instructorTour'
import { SIMPLE_LAUNCH } from '../launchMode'

export const TOURS: Record<TourRole, TourConfig> = {
  member: { role: 'member', label: 'Member tour', href: '/tour/member', steps: memberSteps },
  gym: { role: 'gym', label: 'Gym owner tour', href: '/tour/gym', steps: gymSteps },
  instructor: { role: 'instructor', label: 'Instructor tour', href: '/tour/instructor', steps: instructorSteps },
}

export const TOUR_ROLES: TourRole[] = ['member', 'gym', 'instructor']

export function isTourRole(v: string): v is TourRole {
  return v === 'member' || v === 'gym' || v === 'instructor'
}

/** Map a user's auth roles to the tour roles they should be offered, most-privileged first. */
export function tourRolesForUser(roles: string[]): TourRole[] {
  // Public-launch pivot: gym/instructor management surfaces are hidden, so only offer the member tour.
  if (SIMPLE_LAUNCH) return ['member']
  const out: TourRole[] = []
  if (roles.includes('admin')) out.push('gym')
  if (roles.includes('instructor')) out.push('instructor')
  out.push('member')
  return out
}

/** The single tour to auto-offer a user on first login (their most-privileged track). */
export function primaryTourForUser(roles: string[]): TourRole {
  return tourRolesForUser(roles)[0]
}

/**
 * Which auth Role flags a given tour maps to for the per-role "seen" flag.
 * We reuse existing Role enum values to avoid a new enum: gym→admin, instructor→instructor, member→student.
 */
export function seenRoleFor(role: TourRole): 'admin' | 'instructor' | 'student' {
  if (role === 'gym') return 'admin'
  if (role === 'instructor') return 'instructor'
  return 'student'
}

export type { TourConfig, TourRole, TourStep, ScreenKey } from './types'
