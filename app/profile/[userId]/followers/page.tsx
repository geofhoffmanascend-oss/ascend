import { notFound } from 'next/navigation'
import prisma from '@/lib/database'
import { FollowListView, type Person } from '../FollowListView'

export const metadata = { title: 'Followers' }

export default async function FollowersPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  if (!user) notFound()

  // People who follow this user → Follow.followingId === userId, take the follower.
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: 'desc' },
    select: { follower: { select: { id: true, name: true, belt: true, stripes: true, avatarUrl: true } } },
  })
  const people = rows.map(r => r.follower) as Person[]

  return (
    <FollowListView
      title="Followers"
      subjectName={user.name ?? 'Profile'}
      backHref={`/profile/${userId}`}
      people={people}
      emptyText={`${user.name ?? 'This member'} has no followers yet.`}
    />
  )
}
