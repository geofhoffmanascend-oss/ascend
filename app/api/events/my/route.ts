import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await prisma.publicEvent.findMany({
    where: { submittedById: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { gym: { select: { name: true, slug: true } } },
  })

  return NextResponse.json({ events })
}
