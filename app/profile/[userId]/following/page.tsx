import { notFound } from 'next/navigation'
import prisma from '@/lib/database'
import { FollowListView, type Person } from '../FollowListView'

export const metadata = { title: 'Following' }

export default async function FollowingPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  if (!user) notFound()

  // People this user follows → Follow.followerId === userId, take the following.
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: 'desc' },
    select: { following: { select: { id: true, name: true, belt: true, stripes: true, avatarUrl: true } } },
  })
  const people = rows.map(r => r.following) as Person[]

  return (
    <FollowListView
      title="Following"
      subjectName={user.name ?? 'Profile'}
      backHref={`/profile/${userId}`}
      people={people}
      emptyText={`${user.name ?? 'This member'} isn't following anyone yet.`}
    />
  )
}
