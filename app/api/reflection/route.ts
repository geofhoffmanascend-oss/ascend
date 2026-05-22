import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'
import { ReflectionPrivacy } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reflection = await prisma.trainingReflection.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(reflection ?? null)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { whyStarted, challenges, goals, privacy } = body

  const reflection = await prisma.trainingReflection.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      whyStarted: whyStarted ?? null,
      challenges: challenges ?? null,
      goals: goals ?? null,
      privacy: (privacy as ReflectionPrivacy) ?? 'private',
    },
    update: {
      ...(whyStarted !== undefined && { whyStarted }),
      ...(challenges !== undefined && { challenges }),
      ...(goals !== undefined && { goals }),
      ...(privacy !== undefined && { privacy: privacy as ReflectionPrivacy }),
    },
  })

  return NextResponse.json(reflection)
}
