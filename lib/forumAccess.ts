import type { Session } from 'next-auth'
import { canPostInBeltForum } from './belt'

export type ForumLite = {
  type: string
  gymId: string | null
  classGroup: string | null
  beltLevel: string | null
}

// Can the user VIEW this forum (and thus its gallery)? Mirrors the gates in
// /forum/[id]/page.tsx. `blockedGroups` = the user's blockedClassGroups (only
// needed for group forums; pass [] otherwise).
export function canReadForum(session: Session | null, forum: ForumLite, blockedGroups: string[] = []): boolean {
  if (!session?.user?.id) return false
  const roles = session.user.roles ?? []
  const isStaff = roles.includes('instructor') || roles.includes('admin')
  const isSiteAdmin = roles.includes('site_admin')
  switch (forum.type) {
    case 'instructor_only': return isStaff
    case 'gym_forum':       return isSiteAdmin || session.user.gymId === forum.gymId
    case 'group_forum':     return !forum.classGroup || !blockedGroups.includes(forum.classGroup)
    default:                return true // general, announcement, class_forum, belt_forum, private_lesson
  }
}

// Can the user POST/upload here? Read access + belt-level rule for belt forums.
export function canPostForum(session: Session | null, forum: ForumLite, blockedGroups: string[] = []): boolean {
  if (!canReadForum(session, forum, blockedGroups)) return false
  if (forum.type === 'belt_forum' && forum.beltLevel) {
    return canPostInBeltForum(session?.user?.belt ?? 'white', forum.beltLevel)
  }
  return true
}
