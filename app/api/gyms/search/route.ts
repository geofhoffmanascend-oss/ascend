import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'

// GET /api/gyms/search?q=... — public gym search (no auth required)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim()

  if (!q) {
    return NextResponse.json({ gyms: [] })
  }

  try {
    const gyms = await prisma.gym.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { headInstructorName: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
          { zip: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        headInstructorName: true,
        city: true,
        state: true,
        zip: true,
        participatingStatus: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ gyms })
  } catch (err) {
    console.error('[api/gyms/search GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
