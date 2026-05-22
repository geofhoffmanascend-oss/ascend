import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password too short' }, { status: 400 })

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hashed } })
  await prisma.passwordResetToken.delete({ where: { token } })

  return NextResponse.json({ ok: true })
}
