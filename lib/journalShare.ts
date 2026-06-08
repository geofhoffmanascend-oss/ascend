import prisma from './database'

// Phase 54 — journal sharing.

// A "connection" you can share with: same gym, a follow (either direction), or a
// private-lesson partner.
export async function connectionIds(userId: string, gymId: string | null): Promise<Set<string>> {
  const [gymMembers, following, followers, lessons] = await Promise.all([
    gymId ? prisma.user.findMany({ where: { gymId, id: { not: userId } }, select: { id: true } }) : Promise.resolve([]),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } }),
    prisma.privateLesson.findMany({ where: { OR: [{ requesterId: userId }, { instructorId: userId }] }, select: { requesterId: true, instructorId: true } }),
  ])
  const set = new Set<string>()
  gymMembers.forEach(u => set.add(u.id))
  following.forEach(f => set.add(f.followingId))
  followers.forEach(f => set.add(f.followerId))
  lessons.forEach(l => { set.add(l.requesterId); set.add(l.instructorId) })
  set.delete(userId)
  return set
}

// active if the recipient accepts DMs from the sharer (DM rules); else pending —
// the recipient must approve the share (a journal-share request).
export async function shareStatusFor(sharerRoles: string[], recipientId: string): Promise<'active' | 'pending'> {
  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { allowDmsFromStudents: true } })
  if (!recipient) return 'pending'
  if (recipient.allowDmsFromStudents) return 'active'
  if (sharerRoles.includes('instructor') || sharerRoles.includes('admin')) return 'active'
  return 'pending'
}

// Who can view a journal entry: owner, an active-share recipient, or a same-gym
// instructor/admin (non-private entries only).
export async function canViewLog(
  viewer: { id: string; roles: string[]; gymId: string | null },
  log: { id: string; userId: string; isPrivate: boolean },
  ownerGymId: string | null,
): Promise<boolean> {
  if (viewer.id === log.userId) return true
  const share = await prisma.journalShare.findUnique({
    where: { trainingLogId_toUserId: { trainingLogId: log.id, toUserId: viewer.id } },
    select: { status: true },
  })
  if (share?.status === 'active') return true
  const isStaff = viewer.roles.includes('instructor') || viewer.roles.includes('admin')
  if (!log.isPrivate && isStaff && viewer.gymId && viewer.gymId === ownerGymId) return true
  return false
}
