import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const record = await prisma.emailChangeToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: record.userId }, data: { email: record.newEmail } })
  await prisma.emailChangeToken.delete({ where: { token } })

  return NextResponse.json({ ok: true })
}
