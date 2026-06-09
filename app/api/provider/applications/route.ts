import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { canApproveProviders } from '@/lib/provider'

// GET /api/provider/applications — pending independent-provider applications.
// Visible to verified black belts and site admins.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { belt: true, beltVerified: true, roles: true },
  })
  if (!me || !canApproveProviders(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const apps = await prisma.user.findMany({
    where: { providerStatus: 'pending' },
    select: { id: true, name: true, belt: true, beltVerified: true, providerBio: true, providerCity: true, providerState: true },
    orderBy: { providerApprovedAt: 'asc' },
  })
  return NextResponse.json(apps)
}
