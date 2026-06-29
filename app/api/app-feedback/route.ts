import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export const dynamic = 'force-dynamic'

// Clamp a value to an integer rating 1–5, else null.
function clampRating(v: unknown): number | null {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 1 || n > 5) return null
  return n
}

function cleanText(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, 4000)
  return t || null
}

// POST /api/app-feedback — any authenticated user submits app feedback (floating button).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const feedback = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      userName: session.user.name ?? null,
      ratingOverall: clampRating(body.ratingOverall),
      ratingDisplay: clampRating(body.ratingDisplay),
      ratingNavigation: clampRating(body.ratingNavigation),
      ratingPerformance: clampRating(body.ratingPerformance),
      changeRequest: cleanText(body.changeRequest),
      missingFeatures: cleanText(body.missingFeatures),
      improvement: cleanText(body.improvement),
    },
  })

  // Alert site admins (the platform admins) — never fail the submission if this errors.
  try {
    const admins = await prisma.user.findMany({ where: { roles: { has: 'site_admin' } }, select: { id: true } })
    const who = feedback.userName ?? feedback.userEmail ?? 'A user'
    const snippet = feedback.changeRequest ?? feedback.improvement ?? feedback.missingFeatures
    const message = feedback.ratingOverall
      ? `${who} rated the app ${feedback.ratingOverall}/5${snippet ? ` — “${snippet.slice(0, 80)}”` : ''}.`
      : `${who} left feedback${snippet ? ` — “${snippet.slice(0, 80)}”` : ''}.`
    await Promise.all(
      admins.map(a => createNotification(a.id, 'general', 'New feedback', { body: message, link: '/site-admin/user-feedback' }).catch(() => {})),
    )
  } catch (e) {
    console.error('[app-feedback] notify', e)
  }

  return NextResponse.json({ ok: true })
}
