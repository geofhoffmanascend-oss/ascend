import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'
import { Role } from '@prisma/client'

// PUT — grant site_admin role
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, roles: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (user.roles.includes('site_admin' as Role)) {
    return NextResponse.json({ message: 'Already a site admin' })
  }

  await prisma.user.update({
    where: { id },
    data: { roles: [...user.roles, 'site_admin' as Role] },
  })

  return NextResponse.json({ success: true })
}

// DELETE — revoke site_admin role
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params

  // Prevent self-revocation
  if (session!.user.id === id) {
    return NextResponse.json({ error: 'Cannot revoke your own site admin role' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, roles: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.user.update({
    where: { id },
    data: { roles: user.roles.filter(r => r !== ('site_admin' as Role)) as Role[] },
  })

  return NextResponse.json({ success: true })
}
