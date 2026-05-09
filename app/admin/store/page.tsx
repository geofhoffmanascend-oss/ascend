import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { AdminStoreClient } from './AdminStoreClient'

export default async function AdminStorePage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const [products, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({
      include: {
        user:  { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serialized = {
    products: products.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    orders: orders.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
  }

  return <AdminStoreClient products={serialized.products} orders={serialized.orders} />
}
