import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().replace(/^#/, '').trim()
  if (!q || q.length < 1) return NextResponse.json([])

  const hashtags = await prisma.hashtag.findMany({
    where: { tag: { startsWith: q } },
    include: { _count: { select: { media: true } } },
    orderBy: { media: { _count: 'desc' } },
    take: 8,
  })

  return NextResponse.json(hashtags.map(h => ({ id: h.id, tag: h.tag, count: h._count.media })))
}
