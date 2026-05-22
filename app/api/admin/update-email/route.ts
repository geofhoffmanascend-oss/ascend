import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { sendEmailChangeConfirmation } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { userId, newEmail } = await req.json()
  if (!userId || !newEmail) return NextResponse.json({ error: 'userId and newEmail required' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  // Delete any existing pending change for this user
  await prisma.emailChangeToken.deleteMany({ where: { userId } })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.emailChangeToken.create({ data: { userId, newEmail, token, expiresAt } })

  const base = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3002')
  const confirmUrl = `${base}/confirm-email?token=${token}`

  await sendEmailChangeConfirmation({
    to: newEmail,
    name: user.name ?? 'Member',
    newEmail,
    confirmUrl,
  })

  return NextResponse.json({ ok: true })
}
