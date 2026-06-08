import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// DELETE /api/instructor/availability/[id] — remove one of the caller's entries
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const entry = await prisma.instructorAvailability.findUnique({ where: { id }, select: { instructorId: true } })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.instructorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.instructorAvailability.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
