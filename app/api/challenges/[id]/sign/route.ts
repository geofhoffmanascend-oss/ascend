import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { isParty, maybeAdvanceToGymPending, waiverStateFor } from '@/lib/challenge'

// POST /api/challenges/[id]/sign — e-sign the host gym's visitor waiver.
// Body: { typedName }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const uid = session.user.id

  const c = await prisma.challengeMatch.findUnique({ where: { id } })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isParty(c, uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (c.status !== 'accepted') return NextResponse.json({ error: 'Not ready to sign' }, { status: 409 })

  const { waiver } = await waiverStateFor(id, c.hostGymId, uid)
  if (!waiver) return NextResponse.json({ error: 'No waiver to sign' }, { status: 400 })

  const typedName = (await req.json().catch(() => null))?.typedName?.toString().trim()
  if (!typedName) return NextResponse.json({ error: 'Type your full legal name to sign' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  await prisma.waiverSignature.upsert({
    where: { waiverId_userId_context: { waiverId: waiver.id, userId: uid, context: `challenge:${id}` } },
    update: { typedName, signedAt: new Date(), ip },
    create: { waiverId: waiver.id, userId: uid, typedName, ip, context: `challenge:${id}` },
  })

  await maybeAdvanceToGymPending(id)
  return NextResponse.json({ ok: true })
}
