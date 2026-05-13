import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { GalleryClient } from './GalleryClient'
import { getWatermarkedUrl } from '@/lib/cloudinary'

export default async function GalleryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const items = await prisma.mediaItem.findMany({
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
    displayUrl:   item.type === 'photo' && item.forSale && item.publicId
                    ? getWatermarkedUrl(item.publicId)
                    : item.url,
    thumbnailUrl: item.thumbnailUrl ?? null,
  }))

  const nextCursor = items.length === 25 ? items[items.length - 1].id : null

  return (
    <GalleryClient
      initialItems={serialized}
      nextCursor={nextCursor}
      currentUserId={session.user.id}
      currentUserRoles={session.user.roles}
    />
  )
}
