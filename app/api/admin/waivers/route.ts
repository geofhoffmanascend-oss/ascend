import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { WaiverKind } from '@prisma/client'

const KINDS: WaiverKind[] = ['membership', 'visitor_challenge']

// GET /api/admin/waivers — active waivers for the admin's gym.
export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) return error
  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const waivers = await prisma.gymWaiver.findMany({
    where: { gymId, active: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, kind: true, version: true, title: true, body: true, fileUrl: true, createdAt: true },
  })
  return NextResponse.json({ waivers })
}

// POST /api/admin/waivers — publish a waiver (supersedes the prior active one of the same kind).
// Body: { kind, title, body?, fileUrl? }
export async function POST(req: Request) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const gymId = session.user.gymId
  if (!gymId) return NextResponse.json({ error: 'You are not assigned to a gym.' }, { status: 400 })

  const b = await req.json().catch(() => null)
  const kind = b?.kind as WaiverKind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Invalid waiver kind' }, { status: 400 })
  const title = (b?.title ?? '').toString().trim()
  const body = (b?.body ?? '').toString().trim() || null
  const fileUrl = (b?.fileUrl ?? '').toString().trim() || null
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!body && !fileUrl) return NextResponse.json({ error: 'Provide waiver text or a file URL' }, { status: 400 })

  const prior = await prisma.gymWaiver.findFirst({
    where: { gymId, kind, active: true },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  await prisma.gymWaiver.updateMany({ where: { gymId, kind, active: true }, data: { active: false } })

  const waiver = await prisma.gymWaiver.create({
    data: { gymId, kind, title, body, fileUrl, version: (prior?.version ?? 0) + 1, active: true },
    select: { id: true, kind: true, version: true, title: true },
  })
  return NextResponse.json({ waiver }, { status: 201 })
}
