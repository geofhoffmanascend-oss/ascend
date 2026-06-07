import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getGymSetup, updateGymSetup, type GymSetupProgress } from '@/lib/gymSetup'

// GET /api/admin/gym-setup — owner setup checklist progress for the admin's gym (Phase 38.3)
export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session.user.gymId
  const progress = await getGymSetup(gymId)
  return NextResponse.json(progress)
}

// PUT /api/admin/gym-setup — mark checklist items done/undone for the admin's gym
export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const body = await req.json()
  const allowed: (keyof GymSetupProgress)[] = ['schedule', 'instructors', 'logo', 'roster']
  const patch: Partial<GymSetupProgress> = {}
  for (const key of allowed) {
    if (typeof body[key] === 'boolean') patch[key] = body[key]
  }

  const updated = await updateGymSetup(gymId, patch)
  return NextResponse.json(updated)
}
