import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from '@/lib/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await prisma.product.findMany({
    where: { available: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, price, imageUrl, stock, available, category } = body

  if (!name || typeof price !== 'number')
    return NextResponse.json({ error: 'name and price required' }, { status: 400 })

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      price: Math.round(price),
      imageUrl: imageUrl?.trim() || null,
      stock: Number(stock) || 0,
      available: available ?? true,
      category: category?.trim() || null,
    },
  })
  return NextResponse.json(product, { status: 201 })
}
