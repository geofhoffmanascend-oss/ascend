import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const gymId = session?.user?.gymId ?? null

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      gym: { select: { name: true } },
      divisions: {
        include: {
          registrations: {
            include: { user: { select: { id: true, name: true, belt: true } } },
            orderBy: { seed: 'asc' },
          },
          matches: { orderBy: [{ round: 'asc' }, { position: 'asc' }] },
        },
      },
    },
  })

  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMember = tournament.gymId === gymId
  const isSiteAdmin = session?.user?.roles?.includes('site_admin')

  if (!tournament.isPublic && !isMember && !isSiteAdmin) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ tournament })
}
