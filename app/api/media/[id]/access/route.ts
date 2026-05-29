import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// GET /api/media/[id]/access — get custom access list (uploader only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await prisma.mediaItem.findUnique({ where: { id }, select: { uploaderId: true } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (item.uploaderId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const grants = await prisma.mediaAccess.findMany({
    where: { mediaItemId: id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  })

  return NextResponse.json({ grants })
}

// PUT /api/media/[id]/access — replace custom access list (uploader only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await prisma.mediaItem.findUnique({ where: { id }, select: { uploaderId: true } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (item.uploaderId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userIds } = await req.json()
  if (!Array.isArray(userIds)) return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })

  await prisma.$transaction([
    prisma.mediaAccess.deleteMany({ where: { mediaItemId: id } }),
    prisma.mediaAccess.createMany({
      data: userIds.map((uid: string) => ({ mediaItemId: id, userId: uid })),
      skipDuplicates: true,
    }),
  ])

  const grants = await prisma.mediaAccess.findMany({
    where: { mediaItemId: id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  })

  return NextResponse.json({ grants })
}
