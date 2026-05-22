import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role } = await req.json()
  if (!role) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 })
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardedRoles: true },
  })

  if (!current) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const existing = current.onboardedRoles ?? []
  if (existing.includes(role as Role)) {
    return NextResponse.json({ onboardedRoles: existing })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardedRoles: [...existing, role as Role],
    },
    select: { id: true, onboardedRoles: true },
  })

  return NextResponse.json(updated)
}
