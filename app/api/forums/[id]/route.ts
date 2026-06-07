import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// DELETE /api/forums/[id] — permanently delete a forum and its posts.
// Allowed for the gym admin of the forum's gym, or any site admin.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const forum = await prisma.forum.findUnique({ where: { id }, select: { id: true, gymId: true } })
  if (!forum) return NextResponse.json({ error: 'Forum not found' }, { status: 404 })

  const roles = session.user.roles ?? []
  const isSiteAdmin = roles.includes('site_admin')
  const isGymAdmin = roles.includes('admin') && !!forum.gymId && forum.gymId === session.user.gymId
  if (!isSiteAdmin && !isGymAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Cascades to posts, subscriptions, reads, and forum media.
    await prisma.forum.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/forums/[id] DELETE]', err)
    return NextResponse.json({ error: 'Could not delete this forum.' }, { status: 500 })
  }
}
