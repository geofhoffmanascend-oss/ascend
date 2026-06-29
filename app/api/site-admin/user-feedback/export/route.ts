import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'

export const dynamic = 'force-dynamic'

// RFC-4180 field: wrap in quotes, double any internal quotes.
function csvField(v: unknown): string {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

// GET /api/site-admin/user-feedback/export — full feedback as a CSV download.
export async function GET() {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const rows = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } })

  const header = [
    'createdAt_utc', 'userName', 'userEmail',
    'overall', 'display', 'navigation', 'performance',
    'changeRequest', 'missingFeatures', 'improvement',
  ]

  const lines = [header.map(csvField).join(',')]
  for (const r of rows) {
    lines.push([
      r.createdAt.toISOString(),
      r.userName, r.userEmail,
      r.ratingOverall, r.ratingDisplay, r.ratingNavigation, r.ratingPerformance,
      r.changeRequest, r.missingFeatures, r.improvement,
    ].map(csvField).join(','))
  }

  // UTF-8 BOM + CRLF line endings (RFC-4180).
  const csv = '﻿' + lines.join('\r\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="feedback-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
