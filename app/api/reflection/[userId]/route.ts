import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const session = await getServerSession(authOptions)

  const reflection = await prisma.trainingReflection.findUnique({
    where: { userId },
  })

  if (!reflection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isOwner = session?.user?.id === userId
  const isAdmin = session?.user?.roles?.includes('admin') ?? false

  if (isOwner || isAdmin) {
    return NextResponse.json(reflection)
  }

  if (reflection.privacy === 'public') {
    return NextResponse.json(reflection)
  }

  if (reflection.privacy === 'members') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(reflection)
  }

  // private
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
