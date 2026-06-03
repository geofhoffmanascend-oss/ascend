import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { GalleryClient } from '@/app/gallery/GalleryClient'
import { canReadForum } from '@/lib/forumAccess'

export const metadata: Metadata = { title: 'Forum Gallery' }

export default async function ForumGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const forum = await prisma.forum.findUnique({
    where: { id },
    select: { id: true, title: true, type: true, gymId: true, classGroup: true, beltLevel: true },
  })
  if (!forum) notFound()

  let blockedGroups: string[] = []
  if (forum.type === 'group_forum') {
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { blockedClassGroups: true } })
    blockedGroups = (u?.blockedClassGroups ?? []) as string[]
  }
  if (!canReadForum(session, forum, blockedGroups)) redirect('/forum')

  const items = await prisma.mediaItem.findMany({
    where: { forumId: id },
    include: {
      uploader: { select: { id: true, name: true } },
      tags:     { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      hashtags: { include: { hashtag: { select: { id: true, tag: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
  })

  const serialized = items.map(item => ({
    ...item,
    createdAt:    item.createdAt.toISOString(),
    displayUrl:   item.url,
    thumbnailUrl: item.thumbnailUrl ?? null,
    visibility:   item.visibility as string,
  }))
  const nextCursor = items.length === 25 ? items[items.length - 1].id : null

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6">
      <Link href={`/forum/${id}`} className="text-xs text-ash hover:text-ink transition-colors">← {forum.title}</Link>
      <p className="text-xs text-slate mt-2">Photos shared in this forum. Post a photo in the forum to add to this gallery.</p>
      <GalleryClient
        initialItems={serialized}
        nextCursor={nextCursor}
        currentUserId={session.user.id}
        currentUserRoles={session.user.roles}
        currentUserGymId={session.user.gymId ?? null}
        canUpload={false}
        forumId={id}
      />
    </div>
  )
}
