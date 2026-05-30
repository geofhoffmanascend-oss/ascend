import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const gymId = session.user.gymId ?? null

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      gym: { select: { name: true, slug: true } },
      divisions: {
        include: {
          _count: { select: { registrations: true } },
          registrations: {
            where: { userId: session.user.id },
            select: { id: true, confirmed: true },
          },
          ...(gymId ? {
            matches: {
              orderBy: [{ round: 'asc' }, { position: 'asc' }],
            },
          } : {}),
        },
      },
    },
  })

  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Visibility check
  const isMember = tournament.gymId === gymId
  if (!tournament.isPublic && !isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ tournament, isMember })
}
