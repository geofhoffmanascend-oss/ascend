import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForUser } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { Role } from '@prisma/client'

const VALID_ROLES = ['admin', 'instructor', 'student', 'vendor'] as const

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdminForUser(id)
  if (error) return error

  const { roles } = await req.json() as { roles: string[] }

  if (!Array.isArray(roles) || roles.some(r => !VALID_ROLES.includes(r as any))) {
    return NextResponse.json({ error: 'Invalid roles' }, { status: 400 })
  }

  // All users must retain student role
  const finalRoles = roles.includes('student') ? roles : [...roles, 'student']

  const prevUser = await prisma.user.findUnique({ where: { id }, select: { roles: true } })
  if (!prevUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wasInstructor = prevUser.roles.includes('instructor' as any)
  const nowInstructor = finalRoles.includes('instructor')

  await prisma.user.update({
    where: { id },
    data: {
      roles: finalRoles as Role[],
      // Clear any pending instructor request once the role is granted.
      ...(finalRoles.includes('instructor') && { instructorRequestedAt: null }),
    },
  })

  // Auto-subscribe to instructor forum when instructor role is added
  if (!wasInstructor && nowInstructor) {
    const instructorForum = await prisma.forum.findFirst({ where: { type: 'instructor_only' as any } })
    if (instructorForum) {
      await prisma.forumSubscription.upsert({
        where: { userId_forumId: { userId: id, forumId: instructorForum.id } },
        update: {},
        create: { userId: id, forumId: instructorForum.id },
      })
    }
  }

  return NextResponse.json({ success: true })
}
