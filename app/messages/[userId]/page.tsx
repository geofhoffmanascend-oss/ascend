import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import prisma from '@/lib/database'
import { MessageThread } from './MessageThread'

export default async function ConversationPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { userId: otherId } = await params
  const myId = session.user.id

  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, avatarUrl: true, role: true, allowDmsFromStudents: true },
  })
  if (!other) notFound()

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: myId,    recipientId: otherId },
        { senderId: otherId, recipientId: myId    },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  })

  // Mark thread as read
  await prisma.directMessage.updateMany({
    where: { senderId: otherId, recipientId: myId, readAt: null },
    data: { readAt: new Date() },
  })

  const serialized = messages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  }))

  const canSend = other.allowDmsFromStudents || session.user.role !== 'student'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Messages
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">{other.name ?? 'Unknown'}</h1>
      </div>
      <MessageThread
        messages={serialized}
        currentUserId={myId}
        recipientId={otherId}
        canSend={canSend}
      />
    </div>
  )
}
