import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.roles?.includes('admin') || session.user.roles?.includes('instructor')
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const orders = await prisma.order.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.user.id }),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { items, notes } = body as { items: { productId: string; quantity: number }[]; notes?: string }

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'items required' }, { status: 400 })

  // Validate products and stock
  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) }, available: true },
  })

  if (products.length !== items.length)
    return NextResponse.json({ error: 'One or more products unavailable' }, { status: 400 })

  const orderItems = items.map(i => {
    const p = products.find(p => p.id === i.productId)!
    return { productId: i.productId, quantity: i.quantity, price: p.price }
  })

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      notes:  notes?.trim() || null,
      items:  { create: orderItems },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
    },
  })

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })
  await Promise.all(admins.map(a =>
    createNotification(a.id, 'general', `New store order from ${session.user.name ?? 'a student'}`, { link: '/admin/store' })
  ))

  return NextResponse.json(order, { status: 201 })
}
