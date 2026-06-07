import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { ClassGroup } from '@prisma/client'

const VALID_GROUPS = Object.values(ClassGroup)

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { hiddenClassGroups, hiddenProgramIds } = await req.json() as { hiddenClassGroups?: string[]; hiddenProgramIds?: string[] }

  const data: { hiddenClassGroups?: ClassGroup[]; hiddenProgramIds?: string[] } = {}

  if (hiddenClassGroups !== undefined) {
    if (!Array.isArray(hiddenClassGroups) || hiddenClassGroups.some(g => !VALID_GROUPS.includes(g as ClassGroup))) {
      return NextResponse.json({ error: 'Invalid groups' }, { status: 400 })
    }
    data.hiddenClassGroups = hiddenClassGroups as ClassGroup[]
  }

  // hiddenProgramIds: member's own gym-defined class groups to hide from their
  // schedule. Only affects their own visibility, so no gym-ownership check needed.
  if (hiddenProgramIds !== undefined) {
    if (!Array.isArray(hiddenProgramIds) || hiddenProgramIds.some(id => typeof id !== 'string')) {
      return NextResponse.json({ error: 'Invalid class groups' }, { status: 400 })
    }
    data.hiddenProgramIds = hiddenProgramIds
  }

  await prisma.user.update({ where: { id: session.user.id }, data })

  return NextResponse.json({ success: true })
}
