import type { Session } from 'next-auth'
import { canPostInBeltForum } from './belt'

export type ForumLite = {
  type: string
  gymId: string | null
  classGroup: string | null
  programId?: string | null
  beltLevel: string | null
}

// Can the user VIEW this forum (and thus its gallery)? Mirrors the gates in
// /forum/[id]/page.tsx. `blockedGroups` = the user's blockedClassGroups (fixed
// enum, legacy); `blockedProgramIds` = the user's blocked gym-defined class
// groups. Pass [] when not relevant.
export function canReadForum(
  session: Session | null,
  forum: ForumLite,
  blockedGroups: string[] = [],
  blockedProgramIds: string[] = [],
): boolean {
  if (!session?.user?.id) return false
  const roles = session.user.roles ?? []
  const isStaff = roles.includes('instructor') || roles.includes('admin')
  const isSiteAdmin = roles.includes('site_admin')
  switch (forum.type) {
    case 'instructor_only': return isStaff
    case 'gym_forum':       return isSiteAdmin || session.user.gymId === forum.gymId
    case 'group_forum':     return !forum.classGroup || !blockedGroups.includes(forum.classGroup)
    case 'program_forum':   return isSiteAdmin || (session.user.gymId === forum.gymId && !(forum.programId && blockedProgramIds.includes(forum.programId)))
    case 'group_chat':      return false // membership-gated; handled by the /chats routes, not generic forum surfaces
    default:                return true // general, announcement, class_forum, belt_forum, private_lesson
  }
}

// Can the user POST/upload here? Read access + belt-level rule for belt forums.
export function canPostForum(
  session: Session | null,
  forum: ForumLite,
  blockedGroups: string[] = [],
  blockedProgramIds: string[] = [],
): boolean {
  if (!canReadForum(session, forum, blockedGroups, blockedProgramIds)) return false
  if (forum.type === 'belt_forum' && forum.beltLevel) {
    return canPostInBeltForum(session?.user?.belt ?? 'white', forum.beltLevel)
  }
  return true
}
