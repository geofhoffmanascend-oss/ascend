import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from '@/lib/database'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const { name, description, price, imageUrl, stock, available, category } = body

  // Verify admin has rights to edit this product
  const existing = await prisma.product.findUnique({ where: { id }, select: { gymId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isSiteAdmin = session.user.roles?.includes('site_admin')
  if (!isSiteAdmin && existing.gymId !== null && existing.gymId !== session.user.gymId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined         && { name: name.trim() }),
      ...(description !== undefined  && { description: description?.trim() || null }),
      ...(price !== undefined        && { price: Math.round(Number(price)) }),
      ...(imageUrl !== undefined     && { imageUrl: imageUrl?.trim() || null }),
      ...(stock !== undefined        && { stock: Number(stock) }),
      ...(available !== undefined    && { available }),
      ...(category !== undefined     && { category: category?.trim() || null }),
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
