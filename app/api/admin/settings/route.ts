import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function GET() {
  await requireAdmin()
  const settings = await prisma.gymSettings.findFirst()
  return NextResponse.json(settings ?? { reviewUrl: null })
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { reviewUrl } = await req.json()

  const existing = await prisma.gymSettings.findFirst()
  const settings = existing
    ? await prisma.gymSettings.update({ where: { id: existing.id }, data: { reviewUrl: reviewUrl ?? null } })
    : await prisma.gymSettings.create({ data: { reviewUrl: reviewUrl ?? null } })

  return NextResponse.json(settings)
}
