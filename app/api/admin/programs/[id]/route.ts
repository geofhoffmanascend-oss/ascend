import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForProgram } from '@/lib/adminAuth'
import prisma from '@/lib/database'

// PATCH /api/admin/programs/[id] — rename / edit a program (gym-scoped)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdminForProgram(id)
  if (error) return error

  const body = await req.json()
  const data: { name?: string; description?: string | null; sortOrder?: number } = {}

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Class group name is required' }, { status: 400 })
    data.name = name
  }
  if (body.description !== undefined) {
    data.description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null
  }
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Number(body.sortOrder)
  }

  try {
    const program = await prisma.classProgram.update({ where: { id }, data })
    return NextResponse.json({ program })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A class group with that name already exists.' }, { status: 409 })
    }
    console.error('[api/admin/programs/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/programs/[id] — delete a program (classes keep, programId set null)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdminForProgram(id)
  if (error) return error

  await prisma.classProgram.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
