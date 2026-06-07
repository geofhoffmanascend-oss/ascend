import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

// Phase 52 — gym-defined class programs (Basics, Advanced, …).

// GET /api/admin/programs — list the admin's gym's programs (with class counts)
export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId ?? null
  if (!gymId) return NextResponse.json({ programs: [] })

  const programs = await prisma.classProgram.findMany({
    where: { gymId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { classes: true } } },
  })

  return NextResponse.json({ programs })
}

// POST /api/admin/programs — create a program for the admin's gym
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Class group name is required' }, { status: 400 })

  const description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null
  const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0

  try {
    const program = await prisma.classProgram.create({
      data: { gymId, name, description, sortOrder },
    })
    return NextResponse.json({ program }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: `A class group named "${name}" already exists.` }, { status: 409 })
    }
    console.error('[api/admin/programs POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
