import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForUser } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error, session } = await requireAdminForUser(id)
  if (error) return error

  const user = await prisma.user.update({
    where: { id },
    data: { beltVerified: true, beltVerifiedBy: session!.user.id },
    select: { id: true, belt: true, beltVerified: true, beltVerifiedBy: true },
  })

  return NextResponse.json({ user })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await requireAdminForUser(id)
  if (error) return error

  const user = await prisma.user.update({
    where: { id },
    data: { beltVerified: false, beltVerifiedBy: null },
    select: { id: true, belt: true, beltVerified: true, beltVerifiedBy: true },
  })

  return NextResponse.json({ user })
}
