import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'

// Phase 38 — let a gym admin edit their own gym's basic profile (currently the
// logo). Keys off session.user.gymId so an admin can only touch their own gym.

// GET /api/admin/gym — current gym profile fields for the admin's gym
export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { logoUrl: true, name: true, description: true, hostsInHouseChallenges: true, hostsOpenChallenges: true } })
  return NextResponse.json({
    logoUrl: gym?.logoUrl ?? null, name: gym?.name ?? '', description: gym?.description ?? '',
    hostsInHouseChallenges: gym?.hostsInHouseChallenges ?? false,
    hostsOpenChallenges: gym?.hostsOpenChallenges ?? false,
  })
}

// PATCH /api/admin/gym — update the admin's own gym (logo, name, description).
export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const body = await req.json()
  const data: { logoUrl?: string | null; name?: string; description?: string | null; hostsInHouseChallenges?: boolean; hostsOpenChallenges?: boolean } = {}
  if ('hostsInHouseChallenges' in body) data.hostsInHouseChallenges = !!body.hostsInHouseChallenges
  if ('hostsOpenChallenges' in body) data.hostsOpenChallenges = !!body.hostsOpenChallenges
  if ('logoUrl' in body) {
    const v = body.logoUrl
    data.logoUrl = typeof v === 'string' && v.trim() ? v.trim() : null
  }
  if ('name' in body) {
    const v = body.name
    if (typeof v !== 'string' || !v.trim()) {
      return NextResponse.json({ error: 'Gym name cannot be empty.' }, { status: 400 })
    }
    data.name = v.trim()
  }
  if ('description' in body) {
    const v = body.description
    data.description = typeof v === 'string' && v.trim() ? v.trim() : null
  }

  const gym = await prisma.gym.update({ where: { id: gymId }, data, select: { logoUrl: true, name: true, description: true, hostsInHouseChallenges: true, hostsOpenChallenges: true } })
  return NextResponse.json({ logoUrl: gym.logoUrl, name: gym.name, description: gym.description, hostsInHouseChallenges: gym.hostsInHouseChallenges, hostsOpenChallenges: gym.hostsOpenChallenges })
}
