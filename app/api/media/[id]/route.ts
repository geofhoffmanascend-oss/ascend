import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import cloudinary from '@/lib/cloudinary'

const INCLUDE = {
  uploader: { select: { id: true, name: true } },
  tags:     { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  hashtags: { include: { hashtag: { select: { id: true, tag: true } } } },
}

function parseHashtags(raw: string): string[] {
  return [...(raw.matchAll(/#([a-zA-Z0-9_]+)/g))]
    .map(m => m[1].toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await prisma.mediaItem.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = item.uploaderId === session.user.id
  const isAdmin = session.user.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caption, forSale, price, hashtagsRaw } = await req.json()

  await prisma.mediaItem.update({
    where: { id },
    data: {
      ...(caption !== undefined            ? { caption: caption?.trim() || null } : {}),
      ...(forSale !== undefined && isAdmin ? { forSale: !!forSale }               : {}),
      ...(price   !== undefined && isAdmin ? { price:   price ?? null }            : {}),
    },
  })

  if (hashtagsRaw !== undefined) {
    const tags = parseHashtags(hashtagsRaw)
    await prisma.mediaHashtag.deleteMany({ where: { mediaItemId: id } })
    for (const tag of tags) {
      const hashtag = await prisma.hashtag.upsert({ where: { tag }, create: { tag }, update: {} })
      await prisma.mediaHashtag.create({ data: { mediaItemId: id, hashtagId: hashtag.id } })
    }
  }

  const updated = await prisma.mediaItem.findUnique({ where: { id }, include: INCLUDE })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await prisma.mediaItem.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = item.uploaderId === session.user.id
  const isAdmin = session.user.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (item.publicId) {
    await cloudinary.uploader.destroy(item.publicId).catch(() => {})
  }

  await prisma.mediaItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
