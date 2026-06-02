import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const isStaff = session.user.roles?.includes('instructor') || session.user.roles?.includes('admin')

  const existing = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Content edit: author (or admin) only.
  if (typeof body.content === 'string') {
    const canEdit = existing.authorId === session.user.id || session.user.roles?.includes('admin')
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!body.content.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    const post = await prisma.post.update({ where: { id }, data: { content: body.content.trim() } })
    return NextResponse.json(post)
  }

  // Pin/unpin: instructor/admin only.
  if (typeof body.pinned !== 'boolean' || !isStaff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const post = await prisma.post.update({ where: { id }, data: { pinned: body.pinned } })
  return NextResponse.json(post)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canDelete = post.authorId === session.user.id || session.user.roles?.includes('admin')
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.post.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
