import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { uploadFromBuffer, getYouTubeThumbnail } from '@/lib/cloudinary'

function parseHashtags(raw: string): string[] {
  return [...(raw.matchAll(/#([a-zA-Z0-9_]+)/g))]
    .map(m => m[1].toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
}

async function upsertHashtags(mediaItemId: string, tags: string[]) {
  await prisma.mediaHashtag.deleteMany({ where: { mediaItemId } })
  for (const tag of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where:  { tag },
      create: { tag },
      update: {},
    })
    await prisma.mediaHashtag.create({ data: { mediaItemId, hashtagId: hashtag.id } })
  }
}

const INCLUDE = {
  uploader: { select: { id: true, name: true } },
  tags:     { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  hashtags: { include: { hashtag: { select: { id: true, tag: true } } } },
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp           = req.nextUrl.searchParams
  const taggedUserId = sp.get('taggedUserId')
  const hashtag      = sp.get('hashtag')?.toLowerCase()
  const caption      = sp.get('q')?.trim()
  const myTags       = sp.get('myTags') === '1'
  const cursor       = sp.get('cursor')
  const take         = 24

  const where = {
    ...(taggedUserId && { tags:     { some: { userId: taggedUserId } } }),
    ...(myTags       && { tags:     { some: { userId: session.user.id } } }),
    ...(hashtag      && { hashtags: { some: { hashtag: { tag: hashtag } } } }),
    ...(caption      && { caption:  { contains: caption, mode: 'insensitive' as const } }),
  }

  const items = await prisma.mediaItem.findMany({
    where,
    include: INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore    = items.length > take
  const page       = hasMore ? items.slice(0, take) : items
  const nextCursor = hasMore ? page[page.length - 1].id : null

  return NextResponse.json({ items: page, nextCursor })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData     = await req.formData()
    const file         = formData.get('file') as File | null
    const caption      = (formData.get('caption') as string | null)?.trim() || null
    const hashtagsRaw  = (formData.get('hashtags') as string | null) ?? ''

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are supported' }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const { url, publicId } = await uploadFromBuffer(buffer)

    const item = await prisma.mediaItem.create({
      data: { uploaderId: session.user.id, url, publicId, type: 'photo', caption },
      include: INCLUDE,
    })

    const tags = parseHashtags(hashtagsRaw)
    if (tags.length) await upsertHashtags(item.id, tags)

    const fresh = await prisma.mediaItem.findUnique({ where: { id: item.id }, include: INCLUDE })
    return NextResponse.json(fresh, { status: 201 })
  }

  const { url, caption, hashtagsRaw } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const thumbnailUrl = getYouTubeThumbnail(url.trim())

  const item = await prisma.mediaItem.create({
    data: {
      uploaderId:   session.user.id,
      url:          url.trim(),
      thumbnailUrl: thumbnailUrl ?? undefined,
      type:         'video_link',
      caption:      caption?.trim() || null,
    },
    include: INCLUDE,
  })

  const tags = parseHashtags(hashtagsRaw ?? '')
  if (tags.length) await upsertHashtags(item.id, tags)

  const fresh = await prisma.mediaItem.findUnique({ where: { id: item.id }, include: INCLUDE })
  return NextResponse.json(fresh, { status: 201 })
}
