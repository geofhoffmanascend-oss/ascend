import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// PATCH — recipient approves a pending share (pending → active).
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const share = await prisma.journalShare.findUnique({ where: { id }, select: { toUserId: true } })
  if (!share || share.toUserId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.journalShare.update({ where: { id }, data: { status: 'active' } })
  return NextResponse.json({ success: true })
}

// DELETE — recipient declines / removes a share shared with them.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const share = await prisma.journalShare.findUnique({ where: { id }, select: { toUserId: true } })
  if (!share || share.toUserId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.journalShare.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
