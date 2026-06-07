import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/database'
import { AdminStoreClient } from './AdminStoreClient'

export default async function AdminStorePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin')) redirect('/dashboard')

  // Multi-tenancy: show this gym's products plus platform-wide products (gymId null);
  // orders are limited to this gym.
  const gymId = session.user.gymId ?? null

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { OR: [{ gymId }, { gymId: null }] },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { gymId },
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
