import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { TournamentFormat, TournamentStatus } from '@prisma/client'

async function getOwnedTournament(id: string, gymId: string) {
  const t = await prisma.tournament.findUnique({ where: { id } })
  if (!t) return null
  if (t.gymId !== gymId) return null
  return t
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      divisions: {
        include: {
          registrations: { include: { user: { select: { id: true, name: true, belt: true } } } },
          matches: { orderBy: [{ round: 'asc' }, { position: 'asc' }] },
        },
      },
    },
  })

  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ tournament })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const gymId = session!.user.gymId!

  const existing = await getOwnedTournament(id, gymId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { title, description, date, format, isPublic, status } = await req.json()

  const tournament = await prisma.tournament.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(format !== undefined && { format: format as TournamentFormat }),
      ...(isPublic !== undefined && { isPublic: !!isPublic }),
      ...(status !== undefined && { status: status as TournamentStatus }),
    },
  })

  return NextResponse.json({ tournament })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const gymId = session!.user.gymId!

  const existing = await getOwnedTournament(id, gymId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'draft') return NextResponse.json({ error: 'Only draft tournaments can be deleted' }, { status: 400 })

  await prisma.tournament.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
