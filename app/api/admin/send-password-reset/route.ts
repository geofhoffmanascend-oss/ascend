import { NextRequest, NextResponse } from 'next/server'
import { requireAdminForUser } from '@/lib/adminAuth'
import prisma from '@/lib/database'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { error: authError } = await requireAdminForUser(userId)
  if (authError) return authError

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
  if (!user?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId } })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.passwordResetToken.create({ data: { userId, token, expiresAt } })

  const base = process.env.NEXTAUTH_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002')
  const resetUrl = `${base}/reset-password?token=${token}`

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name ?? 'Member',
    resetUrl,
  })

  return NextResponse.json({ ok: true })
}
