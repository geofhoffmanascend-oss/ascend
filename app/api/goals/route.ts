import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/database'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description, targetDate, category } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

  const goal = await prisma.studentGoal.create({
    data: {
      userId: session.user.id,
      description: description.trim(),
      category: typeof category === 'string' && category.trim() ? category.trim().slice(0, 40) : null,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  })

  return NextResponse.json(goal, { status: 201 })
}
