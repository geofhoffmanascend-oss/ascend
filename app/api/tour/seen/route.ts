import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { Role } from '@prisma/client'
import { isTourRole, seenRoleFor } from '@/lib/tour'

// Marks a tour role as already offered/seen for the current user (per-role flag),
// so the first-login auto-prompt won't show it again.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    // Anonymous viewer — nothing to persist.
    return NextResponse.json({ ok: true })
  }

  const { role } = await req.json().catch(() => ({}))
  if (!isTourRole(role)) {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 })
  }

  const seenRole = seenRoleFor(role) as Role
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tourSeenRoles: true },
    })
    const current = user?.tourSeenRoles ?? []
    if (!current.includes(seenRole)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { tourSeenRoles: { set: [...current, seenRole] } },
      })
    }
  } catch (e) {
    console.error('[tour/seen]', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
