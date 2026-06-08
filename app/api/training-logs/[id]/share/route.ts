import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { connectionIds, shareStatusFor } from '@/lib/journalShare'
import { createNotification } from '@/lib/notify'

async function ownLog(id: string, userId: string) {
  const log = await prisma.trainingLog.findUnique({ where: { id }, select: { id: true, userId: true, title: true } })
  return log && log.userId === userId ? log : null
}

// GET — recipients this entry is shared with (owner only), for "who can see this".
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!(await ownLog(id, session.user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const shares = await prisma.journalShare.findMany({ where: { trainingLogId: id }, orderBy: { createdAt: 'asc' } })
  const users = await prisma.user.findMany({ where: { id: { in: shares.map(s => s.toUserId) } }, select: { id: true, name: true } })
  const nameOf = new Map(users.map(u => [u.id, u.name]))
  return NextResponse.json(shares.map(s => ({ id: s.id, toUserId: s.toUserId, name: nameOf.get(s.toUserId) ?? 'User', status: s.status })))
}

// POST { toUserId } — share with a connection (active or pending per DM rules).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const log = await ownLog(id, session.user.id)
  if (!log) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { toUserId } = await req.json()
  if (!toUserId || toUserId === session.user.id) return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })

  const ids = await connectionIds(session.user.id, session.user.gymId ?? null)
  if (!ids.has(toUserId)) return NextResponse.json({ error: 'You can only share with your connections.' }, { status: 403 })

  const status = await shareStatusFor(session.user.roles ?? [], toUserId)
  const share = await prisma.journalShare.upsert({
    where: { trainingLogId_toUserId: { trainingLogId: id, toUserId } },
    create: { trainingLogId: id, fromUserId: session.user.id, toUserId, status },
    update: { status },
  })

  const who = session.user.name ?? 'Someone'
  if (status === 'active') {
    await createNotification(toUserId, 'general', `${who} shared a journal entry with you`, { link: '/journal' })
  } else {
    await createNotification(toUserId, 'general', `${who} wants to share a journal entry`, { body: 'Approve it in your Journal → Shared with me.', link: '/journal' })
  }

  const user = await prisma.user.findUnique({ where: { id: toUserId }, select: { name: true } })
  return NextResponse.json({ id: share.id, toUserId, name: user?.name ?? 'User', status }, { status: 201 })
}

// DELETE ?toUserId — owner removes a share.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!(await ownLog(id, session.user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const toUserId = req.nextUrl.searchParams.get('toUserId')
  if (!toUserId) return NextResponse.json({ error: 'toUserId required' }, { status: 400 })
  await prisma.journalShare.deleteMany({ where: { trainingLogId: id, toUserId } })
  return NextResponse.json({ success: true })
}
