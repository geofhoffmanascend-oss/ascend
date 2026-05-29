import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'
import { PublicEventType } from '@prisma/client'

// GET /api/events — public, list approved upcoming events
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as PublicEventType | null
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const events = await prisma.publicEvent.findMany({
    where: {
      status: 'approved',
      startDate: {
        gte: startDate ? new Date(startDate) : startOfToday,
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
      ...(type ? { type } : {}),
    },
    orderBy: { startDate: 'asc' },
    take: 50,
    select: {
      id: true,
      title: true,
      type: true,
      location: true,
      city: true,
      state: true,
      startDate: true,
      endDate: true,
      gym: { select: { name: true, slug: true, logoUrl: true } },
    },
  })

  return NextResponse.json({ events })
}

// POST /api/events — authenticated, submit a new event
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, type, description, location, address, city, state, zip, startDate, endDate, gymId } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 })
  if (!city?.trim() || !state?.trim()) return NextResponse.json({ error: 'City and state required' }, { status: 400 })
  if (!startDate) return NextResponse.json({ error: 'Start date required' }, { status: 400 })

  const start = new Date(startDate)
  if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
  if (start < new Date()) return NextResponse.json({ error: 'Start date must be in the future' }, { status: 400 })

  const end = endDate ? new Date(endDate) : null
  if (end && end <= start) return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })

  const event = await prisma.publicEvent.create({
    data: {
      title: title.trim(),
      type,
      description: description?.trim() || null,
      location: location?.trim() || null,
      address: address?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      zip: zip?.trim() || null,
      startDate: start,
      endDate: end,
      submittedById: session.user.id,
      gymId: gymId || null,
    },
  })

  // Notify all site admins
  const siteAdmins = await prisma.user.findMany({
    where: { roles: { has: 'site_admin' } },
    select: { id: true },
  })
  await Promise.all(
    siteAdmins.map(a =>
      createNotification(a.id, 'general', `New event submitted: ${event.title}`, {
        body: `${city}, ${state} · ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        link: '/site-admin/events',
      })
    )
  )

  return NextResponse.json({ event }, { status: 201 })
}
