import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ count: 0 })
  // Phase 53 — hide DM badge for gym admins viewing as a user.
  if (session.viewAs && !session.viewAs.bySiteAdmin) return NextResponse.json({ count: 0 })

  const count = await prisma.directMessage.count({
    where: { recipientId: session.user.id, readAt: null },
  })

  return NextResponse.json({ count })
}
