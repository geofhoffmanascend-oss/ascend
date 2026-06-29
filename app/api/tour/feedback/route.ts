import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

const ROLES = ['member', 'gym', 'instructor']

// Records one per-feature (or overall) feedback datapoint. Works logged-out (userId null).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { role, featureKey } = body
  if (!ROLES.includes(role) || typeof featureKey !== 'string' || !featureKey) {
    return NextResponse.json({ error: 'role and featureKey are required' }, { status: 400 })
  }

  const rating =
    body.rating === null || body.rating === undefined ? null : Math.trunc(Number(body.rating))
  if (rating !== null && Number.isNaN(rating)) {
    return NextResponse.json({ error: 'rating must be a number' }, { status: 400 })
  }
  const comment =
    typeof body.comment === 'string' ? body.comment.slice(0, 1000) : null

  try {
    await prisma.tourFeedback.create({
      data: {
        userId: session?.user?.id ?? null,
        role,
        featureKey: featureKey.slice(0, 80),
        rating,
        comment,
      },
    })
  } catch (e) {
    // Table may not exist until `prisma db push` is run — don't break the tour.
    console.error('[tour/feedback]', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
