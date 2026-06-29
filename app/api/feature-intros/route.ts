import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

// GET /api/feature-intros — the feature keys this user has dismissed ("don't show again").
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ dismissed: [] })
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dismissedIntros: true },
    })
    return NextResponse.json({ dismissed: user?.dismissedIntros ?? [] })
  } catch {
    return NextResponse.json({ dismissed: [] })
  }
}
