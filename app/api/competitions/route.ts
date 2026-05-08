import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, date, location, division, weightClass, result, notes } = await req.json()
  if (!name?.trim() || !date) return NextResponse.json({ error: 'Name and date required' }, { status: 400 })

  const competition = await prisma.competition.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      date: new Date(date),
      location: location?.trim() || null,
      division: division?.trim() || null,
      weightClass: weightClass?.trim() || null,
      result: result?.trim() || null,
      notes: notes?.trim() || null,
    },
  })

  return NextResponse.json(competition, { status: 201 })
}
