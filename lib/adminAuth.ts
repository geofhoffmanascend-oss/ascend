import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from './database'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  if (!session.user.roles?.includes('admin')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

// Multi-tenancy guard: require admin AND that the target user belongs to the
// admin's own gym. site_admin bypasses the gym check. Returns the target's
// { id, gymId } so callers don't need to re-fetch.
export async function requireAdminForUser(targetUserId: string) {
  const { error, session } = await requireAdmin()
  if (error) return { error, session: null, target: null }

  if (!targetUserId) {
    return { error: NextResponse.json({ error: 'User id required' }, { status: 400 }), session: null, target: null }
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, gymId: true },
  })
  if (!target) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }), session: null, target: null }
  }

  const isSiteAdmin = session!.user.roles?.includes('site_admin')
  if (!isSiteAdmin && target.gymId !== session!.user.gymId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null, target: null }
  }

  return { error: null, session: session!, target }
}

// Multi-tenancy guard for class-scoped routes: require admin AND that the class
// belongs to the admin's own gym (site_admin bypasses).
export async function requireAdminForClass(classId: string) {
  const { error, session } = await requireAdmin()
  if (error) return { error, session: null, klass: null }

  const klass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, gymId: true },
  })
  if (!klass) {
    return { error: NextResponse.json({ error: 'Class not found' }, { status: 404 }), session: null, klass: null }
  }

  const isSiteAdmin = session!.user.roles?.includes('site_admin')
  if (!isSiteAdmin && klass.gymId !== session!.user.gymId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null, klass: null }
  }

  return { error: null, session: session!, klass }
}

// Multi-tenancy guard for class-program routes: require admin AND that the
// program belongs to the admin's own gym (site_admin bypasses).
export async function requireAdminForProgram(programId: string) {
  const { error, session } = await requireAdmin()
  if (error) return { error, session: null, program: null }

  const program = await prisma.classProgram.findUnique({
    where: { id: programId },
    select: { id: true, gymId: true },
  })
  if (!program) {
    return { error: NextResponse.json({ error: 'Program not found' }, { status: 404 }), session: null, program: null }
  }

  const isSiteAdmin = session!.user.roles?.includes('site_admin')
  if (!isSiteAdmin && program.gymId !== session!.user.gymId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null, program: null }
  }

  return { error: null, session: session!, program }
}
