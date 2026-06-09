import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForProgram } from '@/lib/adminAuth'
import prisma from '@/lib/database'

// POST /api/admin/programs/[id]/forum — create (or return) the class group's
// dedicated forum (Phase 52.4). Idempotent: one program_forum per group.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdminForProgram(id)
  if (error) return error

  const program = await prisma.classProgram.findUnique({
    where: { id },
    select: { id: true, gymId: true, name: true, forum: { select: { id: true } } },
  })
  if (!program) return NextResponse.json({ error: 'Class group not found' }, { status: 404 })

  if (program.forum) {
    return NextResponse.json({ forumId: program.forum.id, created: false })
  }

  const forum = await prisma.forum.create({
    data: {
      type: 'program_forum',
      title: `${program.name} Forum`,
      gymId: program.gymId,
      programId: program.id,
    },
    select: { id: true },
  })

  // Auto-subscribe every gym member who has access to this class group
  // (i.e. not blocked from it) to its new forum.
  const members = await prisma.user.findMany({
    where: { gymId: program.gymId, NOT: { blockedProgramIds: { has: program.id } } },
    select: { id: true },
  })
  if (members.length > 0) {
    await prisma.forumSubscription.createMany({
      data: members.map(m => ({ userId: m.id, forumId: forum.id })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ forumId: forum.id, created: true }, { status: 201 })
}
