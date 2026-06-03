import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { GalleryClient } from '../../GalleryClient'
import { getWatermarkedUrl } from '@/lib/cloudinary'
import { visibilityFilter } from '@/lib/mediaAccess'
import { getEffectiveFeatures } from '@/lib/features'

export default async function HashtagAlbumPage({ params }: { params: Promise<{ tag: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { gallery, galleryUpload } = await getEffectiveFeatures(session)
  if (!gallery) redirect('/dashboard')

  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag).toLowerCase().replace(/^#/, '')

  const hashtag = await prisma.hashtag.findUnique({
    where: { tag },
    include: { _count: { select: { media: true } } },
  })
  if (!hashtag) notFound()

  const visFilter = visibilityFilter(session.user.id, session.user.gymId ?? null)
  const items = await prisma.mediaItem.findMany({
    where: { hashtags: { some: { hashtagId: hashtag.id } }, ...visFilter, forumId: null },
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
    createdAt:  item.createdAt.toISOString(),
    displayUrl: item.type === 'photo' && item.forSale && item.publicId
      ? getWatermarkedUrl(item.publicId)
      : item.url,
    thumbnailUrl: item.thumbnailUrl ?? null,
    visibility: item.visibility as string,
  }))

  const nextCursor = items.length === 25 ? items[items.length - 1].id : null

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link href="/gallery" className="text-xs text-ash hover:text-ink transition-colors">← Gallery</Link>
        <div className="mt-2 mb-2 inline-block bg-brand-red px-3 py-1">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">#{tag}</span>
        </div>
        <p className="text-xs text-ash mb-4">{hashtag._count.media} photo{hashtag._count.media !== 1 ? 's' : ''}</p>
      </div>
      <GalleryClient
        initialItems={serialized}
        nextCursor={nextCursor}
        currentUserId={session.user.id}
        currentUserRoles={session.user.roles}
        currentUserGymId={session.user.gymId ?? null}
        canUpload={galleryUpload}
      />
    </div>
  )
}
