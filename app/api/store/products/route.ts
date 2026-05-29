import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSiteAdmin = session.user.roles?.includes('site_admin')
  const gymId = session.user.gymId ?? null

  const products = await prisma.product.findMany({
    where: {
      available: true,
      ...(isSiteAdmin ? {} : {
        OR: [
          { gymId: null },
          ...(gymId ? [{ gymId }] : []),
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, price, imageUrl, stock, available, category, gymId: reqGymId } = body

  if (!name || typeof price !== 'number')
    return NextResponse.json({ error: 'name and price required' }, { status: 400 })

  const isSiteAdmin = session.user.roles?.includes('site_admin')
  // Non-site-admins can only create products for their own gym
  const gymId = isSiteAdmin ? (reqGymId ?? null) : (session.user.gymId ?? null)

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      price: Math.round(price),
      imageUrl: imageUrl?.trim() || null,
      stock: Number(stock) || 0,
      available: available ?? true,
      category: category?.trim() || null,
      gymId,
    },
  })
  return NextResponse.json(product, { status: 201 })
}
