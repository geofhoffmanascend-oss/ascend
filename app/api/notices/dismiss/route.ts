import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// One-time site notices (not feature explainers). Dismissals are stored in the same
// `dismissedIntros` array as feature intros and read back via GET /api/feature-intros.
const NOTICE_KEYS = ['gym_mgmt_paused_v1']

// POST /api/notices/dismiss { key } — record "don't show this notice again".
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await req.json().catch(() => ({}))
  if (typeof key !== 'string' || !NOTICE_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Unknown notice' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { dismissedIntros: true } })
    const current = user?.dismissedIntros ?? []
    if (!current.includes(key)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { dismissedIntros: { set: [...current, key] } },
      })
    }
  } catch (e) {
    console.error('[notices/dismiss]', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
  return NextResponse.json({ ok: true })
}
