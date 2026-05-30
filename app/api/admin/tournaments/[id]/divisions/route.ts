import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { Belt } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id: tournamentId } = await params
  const gymId = session!.user.gymId!

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { gymId: true, status: true } })
  if (!tournament || tournament.gymId !== gymId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tournament.status !== 'draft') return NextResponse.json({ error: 'Cannot add divisions after tournament is published' }, { status: 400 })

  const { name, beltMin, beltMax, weightClass, ageGroup } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const division = await prisma.division.create({
    data: {
      tournamentId,
      name: name.trim(),
      beltMin: beltMin as Belt,
      beltMax: beltMax as Belt,
      weightClass: weightClass?.trim() || null,
      ageGroup: ageGroup?.trim() || null,
    },
  })

  return NextResponse.json({ division }, { status: 201 })
}
