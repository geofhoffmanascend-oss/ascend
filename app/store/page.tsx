import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { StoreClient } from './StoreClient'

export default async function StorePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { available: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const serialized = {
    products: products.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })),
    orders: orders.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
  }

  return <StoreClient products={serialized.products} myOrders={serialized.orders} />
}
