import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId ?? null
  const settings = gymId ? await prisma.gymSettings.findUnique({ where: { gymId } }) : null
  return NextResponse.json(settings ?? { reviewUrl: null })
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session!.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const { reviewUrl } = await req.json()

  // Scope to THIS gym's settings row (gymId is @unique).
  const settings = await prisma.gymSettings.upsert({
    where: { gymId },
    update: { reviewUrl: reviewUrl ?? null },
    create: { gymId, reviewUrl: reviewUrl ?? null },
  })

  return NextResponse.json(settings)
}
