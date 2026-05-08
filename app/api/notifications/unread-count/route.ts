import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ count: 0 })

  const count = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })

  return NextResponse.json({ count })
}
