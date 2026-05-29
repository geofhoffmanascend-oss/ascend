import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export async function requireSiteAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  if (!session.user.roles?.includes('site_admin')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}
