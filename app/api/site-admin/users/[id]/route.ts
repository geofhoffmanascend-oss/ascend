import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import { Role } from '@prisma/client'

const ALL_ROLES: Role[] = ['student', 'instructor', 'admin', 'vendor', 'site_admin']

// Site-admin edit of any user. Scalar profile fields + gym + roles.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSiteAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string') data.name = body.name.trim() || null
  if (typeof body.email === 'string') data.email = body.email.trim().toLowerCase()
  if (typeof body.phone === 'string') data.phone = body.phone.trim() || null
  if (typeof body.belt === 'string') data.belt = body.belt
  if (typeof body.stripes === 'number') data.stripes = body.stripes
  if (typeof body.beltVerified === 'boolean') {
    data.beltVerified = body.beltVerified
    data.beltVerifiedBy = body.beltVerified ? (session!.user.name ?? 'Site Admin') : null
  }
  if ('gymId' in body) data.gymId = body.gymId || null

  if (Array.isArray(body.roles)) {
    const roles = body.roles.filter((r: string) => ALL_ROLES.includes(r as Role)) as Role[]
    if (!roles.includes('student')) roles.push('student') // student always required
    // Don't let a site admin strip their own site_admin role (lockout guard).
    if (id === session!.user.id && !roles.includes('site_admin')) {
      return NextResponse.json({ error: "You can't remove your own site-admin role." }, { status: 400 })
    }
    data.roles = roles
  }

  try {
    const user = await prisma.user.update({ where: { id }, data })
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } })
  } catch (e) {
    const msg = (e as { code?: string })?.code === 'P2002' ? 'That email is already in use.' : 'Update failed.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
