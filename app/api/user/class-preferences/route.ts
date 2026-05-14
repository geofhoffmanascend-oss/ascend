import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'

const VALID_GROUPS = Object.values(ClassGroup)

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { hiddenClassGroups } = await req.json() as { hiddenClassGroups: string[] }

  if (!Array.isArray(hiddenClassGroups) || hiddenClassGroups.some(g => !VALID_GROUPS.includes(g as ClassGroup))) {
    return NextResponse.json({ error: 'Invalid groups' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hiddenClassGroups: hiddenClassGroups as ClassGroup[] },
  })

  return NextResponse.json({ success: true })
}
