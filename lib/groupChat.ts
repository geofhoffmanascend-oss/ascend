import prisma from './database'

// Public-launch pivot — group chats are Forums of type `group_chat`.
// Membership is modeled with ForumSubscription (a subscriber = a member).
// "Connected" = follow: a user who follows any current member may join directly.

export async function getChatMemberIds(forumId: string): Promise<string[]> {
  const subs = await prisma.forumSubscription.findMany({
    where: { forumId },
    select: { userId: true },
  })
  return subs.map(s => s.userId)
}

export async function isChatMember(userId: string, forumId: string): Promise<boolean> {
  const sub = await prisma.forumSubscription.findUnique({
    where: { userId_forumId: { userId, forumId } },
    select: { id: true },
  })
  return !!sub
}

export async function addChatMember(userId: string, forumId: string): Promise<void> {
  await prisma.forumSubscription.upsert({
    where: { userId_forumId: { userId, forumId } },
    create: { userId, forumId },
    update: {},
  })
}

// Does `userId` follow any of the given member ids? (the "connected" fast-path)
export async function followsAnyMember(userId: string, memberIds: string[]): Promise<boolean> {
  if (memberIds.length === 0) return false
  const f = await prisma.follow.findFirst({
    where: { followerId: userId, followingId: { in: memberIds } },
    select: { id: true },
  })
  return !!f
}
