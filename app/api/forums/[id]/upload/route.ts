import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { uploadFromBuffer } from '@/lib/cloudinary'
import { canPostForum } from '@/lib/forumAccess'

// Upload a single image for a forum post/reply. Forum-access-gated (NOT the
// gallery toggle). Returns { url } only — the MediaItem is created when the
// post is created (POST /api/forums/[id]/posts with imageUrl).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: forumId } = await params
  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
    select: { type: true, gymId: true, classGroup: true, programId: true, beltLevel: true },
  })
  if (!forum) return NextResponse.json({ error: 'Forum not found' }, { status: 404 })

  // Group chat: members may upload (canPostForum denies group_chat by design).
  if ((forum.type as string) === 'group_chat') {
    const member = await prisma.forumSubscription.findUnique({
      where: { userId_forumId: { userId: session.user.id, forumId } },
      select: { id: true },
    })
    if (!member) return NextResponse.json({ error: 'Join the chat to post.' }, { status: 403 })
  } else {
    let blockedGroups: string[] = []
    let blockedProgramIds: string[] = []
    if (forum.type === 'group_forum' || forum.type === 'program_forum') {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { blockedClassGroups: true, blockedProgramIds: true } })
      blockedGroups = (user?.blockedClassGroups ?? []) as string[]
      blockedProgramIds = (user?.blockedProgramIds ?? []) as string[]
    }
    if (!canPostForum(session, forum, blockedGroups, blockedProgramIds)) {
      return NextResponse.json({ error: 'You cannot post in this forum' }, { status: 403 })
    }
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are supported' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url } = await uploadFromBuffer(buffer, 'ascend/forums')
  return NextResponse.json({ url }, { status: 201 })
}
