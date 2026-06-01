import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

// Public, self-service password reset request.
// Always returns { ok: true } to avoid leaking which emails are registered.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Case-insensitive — registration stores email as-typed
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
    select: { id: true, name: true, email: true },
  })

  if (user?.email) {
    // One active token per user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })

    const base = process.env.NEXTAUTH_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002')
    const resetUrl = `${base}/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? 'Member',
        resetUrl,
        selfService: true,
      })
    } catch (err) {
      console.error('[forgot-password] email send failed:', err)
      // Still return ok — don't reveal failure state to the caller
    }
  }

  return NextResponse.json({ ok: true })
}
