import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { applyInvite } from '@/lib/invites'

// POST /api/invites/[token]/accept — apply an invite for the logged-in user.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params
  const result = await applyInvite(token, session.user.id)
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 })
  return NextResponse.json(result)
}
