import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: { forum: { select: { type: true } } },
  })

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  if ((post.forum.type as string) !== 'belt_forum') {
    return NextResponse.json({ error: 'Use regular moderation tools for non-belt forums' }, { status: 403 })
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
