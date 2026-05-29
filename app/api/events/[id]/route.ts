import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const event = await prisma.publicEvent.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true } },
      gym: { select: { name: true, slug: true, logoUrl: true } },
    },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (event.status === 'approved') return NextResponse.json({ event })

  // Pending/rejected: only submitter or site_admin can view
  if (!session?.user?.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isSiteAdmin = session.user.roles?.includes('site_admin')
  if (!isSiteAdmin && session.user.id !== event.submittedById) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ event })
}
