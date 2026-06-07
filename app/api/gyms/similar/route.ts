import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// Phase 38.5 — duplicate / similar-gym detection.
// Canonical-gym rule (guide §3.5):
//   - tight match  = normalized name + zip   → "likely duplicate"
//   - loose match  = normalized name + state → "similar"
// Returns matches so the owner flow can warn-and-fork before creating.
// Detection only — claim mechanics are Phase 39.

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(jiu[\s-]?jitsu|bjj|academy|gym|martial arts|mma)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// GET /api/gyms/similar?name=...&state=...&zip=...
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const name = (searchParams.get('name') ?? '').trim()
  const state = (searchParams.get('state') ?? '').trim()
  const zip = (searchParams.get('zip') ?? '').trim()

  if (!name) {
    return NextResponse.json({ matches: [] })
  }

  const target = normalize(name)
  if (!target) return NextResponse.json({ matches: [] })

  try {
    // Pull candidate gyms that share at least one significant token in the name
    // (DB-side `contains` on the raw name keeps the candidate set small), then
    // do the canonical normalize/compare in app code.
    const candidates = await prisma.gym.findMany({
      where: {
        name: { contains: target.split(' ')[0] || name, mode: 'insensitive' },
      },
      select: {
        id: true, name: true, slug: true, city: true, state: true, zip: true,
        headInstructorName: true, participatingStatus: true,
      },
      take: 50,
    })

    const matches = candidates
      .map(g => {
        const gNorm = normalize(g.name)
        if (gNorm !== target) return null
        let kind: 'duplicate' | 'similar' | null = null
        if (zip && g.zip && g.zip.trim() === zip) kind = 'duplicate'
        else if (state && g.state && g.state.trim().toLowerCase() === state.toLowerCase()) kind = 'similar'
        if (!kind) return null
        return { ...g, matchKind: kind }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      // duplicates first
      .sort((a, b) => (a.matchKind === 'duplicate' ? -1 : 1) - (b.matchKind === 'duplicate' ? -1 : 1))

    return NextResponse.json({ matches })
  } catch (err) {
    console.error('[api/gyms/similar GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
