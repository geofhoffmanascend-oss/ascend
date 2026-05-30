import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { TournamentFormat } from '@prisma/client'

export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId
  if (!gymId) return NextResponse.json({ error: 'No gym associated with this admin' }, { status: 400 })

  const tournaments = await prisma.tournament.findMany({
    where: { gymId },
    include: { _count: { select: { divisions: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ tournaments })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId
  if (!gymId) return NextResponse.json({ error: 'No gym associated with this admin' }, { status: 400 })

  const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { participatingStatus: true } })
  if (gym?.participatingStatus !== 'participating') {
    return NextResponse.json({ error: 'Tournament creation requires a Participating gym subscription.' }, { status: 403 })
  }

  const { title, description, date, format, isPublic } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })
  if (!format) return NextResponse.json({ error: 'Format required' }, { status: 400 })

  const tournament = await prisma.tournament.create({
    data: {
      gymId,
      title: title.trim(),
      description: description?.trim() || null,
      date: new Date(date),
      format: format as TournamentFormat,
      isPublic: !!isPublic,
      createdById: session!.user.id,
    },
  })

  return NextResponse.json({ tournament }, { status: 201 })
}
