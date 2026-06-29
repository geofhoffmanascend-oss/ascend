import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { FEATURE_INTROS } from '@/lib/featureIntros'

// POST /api/feature-intros/dismiss { featureKey } — record "don't show this again".
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { featureKey } = await req.json().catch(() => ({}))
  if (typeof featureKey !== 'string' || !(featureKey in FEATURE_INTROS)) {
    return NextResponse.json({ error: 'Unknown feature' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { dismissedIntros: true } })
    const current = user?.dismissedIntros ?? []
    if (!current.includes(featureKey)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { dismissedIntros: { set: [...current, featureKey] } },
      })
    }
  } catch (e) {
    console.error('[feature-intros/dismiss]', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
  return NextResponse.json({ ok: true })
}
