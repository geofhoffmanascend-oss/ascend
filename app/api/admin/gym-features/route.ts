import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getGymFeatures, upsertGymFeatures, GYM_FEATURE_DEFAULTS, type GymFeatureFlags } from '@/lib/gymFeatures'

// GET /api/admin/gym-features — current feature flags for the admin's gym
export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json(GYM_FEATURE_DEFAULTS)

  const flags = await getGymFeatures(gymId)
  return NextResponse.json(flags)
}

// PUT /api/admin/gym-features — update feature flags for the admin's gym
export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const body = await req.json()
  const allowed: (keyof GymFeatureFlags)[] = [
    'storeEnabled', 'tournamentsEnabled', 'galleryEnabled', 'galleryUploadEnabled',
    'privateLessonsEnabled', 'gymForumEnabled', 'journalEnabled',
  ]
  const flags: Partial<GymFeatureFlags> = {}
  for (const key of allowed) {
    if (typeof body[key] === 'boolean') flags[key] = body[key]
  }

  const updated = await upsertGymFeatures(gymId, flags)
  return NextResponse.json(updated)
}
