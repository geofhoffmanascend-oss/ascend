import { NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

export const dynamic = 'force-dynamic'

const round1 = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10)

// GET /api/site-admin/user-feedback — totals, averages, and the latest entries.
export async function GET() {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const [total, agg, entries] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.aggregate({
      _avg: { ratingOverall: true, ratingDisplay: true, ratingNavigation: true, ratingPerformance: true },
    }),
    prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
  ])

  return NextResponse.json({
    total,
    averages: {
      overall: round1(agg._avg.ratingOverall),
      display: round1(agg._avg.ratingDisplay),
      navigation: round1(agg._avg.ratingNavigation),
      performance: round1(agg._avg.ratingPerformance),
    },
    entries,
  })
}
