// Phase 58 — control-screen authorization for a match table.
//
// A user may operate a table if they are: the creator, an explicit assignee
// (canScore / canTime), the host gym's admin, or a site_admin.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from './database'

type Caps = { canScore: boolean; canTime: boolean; isManager: boolean }

export async function requireTableOperator(tableId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null, table: null, caps: null as Caps | null }
  }

  const table = await prisma.matchTable.findUnique({
    where: { id: tableId },
    include: { assignments: { where: { userId: session.user.id } } },
  })
  if (!table) {
    return { error: NextResponse.json({ error: 'Table not found' }, { status: 404 }), session: null, table: null, caps: null as Caps | null }
  }

  const roles = session.user.roles ?? []
  const isSiteAdmin = roles.includes('site_admin')
  const isGymAdmin = roles.includes('admin') && !!table.gymId && table.gymId === session.user.gymId
  const isCreator = table.createdById === session.user.id
  const isManager = isSiteAdmin || isGymAdmin || isCreator
  const assignment = table.assignments[0]

  if (!isManager && !assignment) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null, table: null, caps: null as Caps | null }
  }

  const caps: Caps = {
    canScore: isManager || !!assignment?.canScore,
    canTime: isManager || !!assignment?.canTime,
    isManager,
  }
  return { error: null, session, table, caps }
}
