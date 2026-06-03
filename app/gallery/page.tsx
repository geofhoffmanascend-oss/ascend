import type { Metadata } from "next"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { GalleryClient } from './GalleryClient'
import { getWatermarkedUrl } from '@/lib/cloudinary'
import { visibilityFilter } from '@/lib/mediaAccess'
import { getEffectiveFeatures } from '@/lib/features'

export const metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { gallery, galleryUpload } = await getEffectiveFeatures(session)
  if (!gallery) redirect('/dashboard')

  const items = await prisma.mediaItem.findMany({
    where: { ...visibilityFilter(session.user.id, session.user.gymId ?? null), forumId: null },
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
    visibility:   item.visibility as string,
  }))

  const nextCursor = items.length === 25 ? items[items.length - 1].id : null

  return (
    <GalleryClient
      initialItems={serialized}
      nextCursor={nextCursor}
      currentUserId={session.user.id}
      currentUserRoles={session.user.roles}
      currentUserGymId={session.user.gymId ?? null}
      canUpload={galleryUpload}
    />
  )
}
