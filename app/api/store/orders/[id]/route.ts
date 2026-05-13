import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { createNotification } from '@/lib/notify'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.roles?.includes('admin') && !session?.user?.roles?.includes('instructor'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json()

  const validStatuses = ['pending', 'ready', 'picked_up', 'cancelled']
  if (!validStatuses.includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { id: true, name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  })

  // Notify student on status change
  const itemNames = order.items.map(i => i.product.name).join(', ')
  if (status === 'ready') {
    await createNotification(order.userId, 'general', `Your order (${itemNames}) is ready for pickup!`, { link: '/store' })
  } else if (status === 'picked_up') {
    await createNotification(order.userId, 'general', `Your order (${itemNames}) has been marked as picked up. Enjoy!`, { link: '/store' })
  } else if (status === 'cancelled') {
    await createNotification(order.userId, 'general', `Your order (${itemNames}) was cancelled. Contact the gym for details.`, { link: '/store' })
  }

  return NextResponse.json(order)
}
