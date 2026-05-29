import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import prisma from '@/lib/database'
import { PublicEventStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { error } = await requireSiteAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') ?? 'pending') as PublicEventStatus

  const events = await prisma.publicEvent.findMany({
    where: { status },
    orderBy: { createdAt: 'asc' },
    include: {
      submittedBy: { select: { name: true, email: true } },
      gym: { select: { name: true, slug: true } },
    },
  })

  return NextResponse.json({ events })
}
