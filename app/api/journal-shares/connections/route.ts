import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { connectionIds } from '@/lib/journalShare'

// GET /api/journal-shares/connections?q= — people the user can share a journal
// entry with (gym, follows either way, private-lesson partners), filtered by name.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const ids = await connectionIds(session.user.id, session.user.gymId ?? null)
  if (ids.size === 0) return NextResponse.json([])

  const users = await prisma.user.findMany({
    where: {
      id: { in: Array.from(ids) },
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    select: { id: true, name: true, avatarUrl: true, roles: true, belt: true },
    orderBy: { name: 'asc' },
    take: 15,
  })
  return NextResponse.json(users)
}
