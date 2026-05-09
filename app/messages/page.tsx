import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { NewMessageButton } from './NewMessageButton'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [messages, pendingRequestCount] = await Promise.all([
    prisma.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender:    { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.messageRequest.count({ where: { recipientId: userId, status: 'pending' } }),
  ])

  // One entry per conversation partner (latest message per thread)
  const seen = new Set<string>()
  const conversations: typeof messages = []
  for (const msg of messages) {
    const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId
    if (!seen.has(otherId)) {
      seen.add(otherId)
      conversations.push(msg)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Messages
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">Direct Messages</h1>
          <NewMessageButton />
        </div>
      </div>

      {pendingRequestCount > 0 && (
        <Link
          href="/messages/requests"
          className="flex items-center justify-between border border-smoke bg-paper px-4 py-3 mb-4 hover:border-steel transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-brand-red rounded-full" />
            <span className="text-sm text-ink font-medium">Message Requests</span>
          </div>
          <span className="text-xs font-bold text-paper bg-brand-red px-2 py-0.5 rounded-full">
            {pendingRequestCount}
          </span>
        </Link>
      )}

      {pendingRequestCount === 0 && (
        <Link
          href="/messages/requests"
          className="flex items-center justify-between border border-smoke bg-paper px-4 py-3 mb-4 hover:border-steel transition-colors"
        >
          <span className="text-sm text-steel">Message Requests</span>
          <span className="text-xs text-ash">None pending</span>
        </Link>
      )}

      {conversations.length === 0 ? (
        <div className="border border-smoke bg-paper p-10 text-center">
          <p className="text-ash text-sm">No messages yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map(msg => {
            const other = msg.senderId === userId ? msg.recipient : msg.sender
            const unread = msg.recipientId === userId && !msg.readAt
            return (
              <Link
                key={other.id}
                href={`/messages/${other.id}`}
                className={`border bg-paper p-4 flex items-center gap-4 hover:border-steel transition-colors ${unread ? 'border-brand-red' : 'border-smoke'}`}
              >
                <div className="w-10 h-10 rounded-full bg-mist border border-smoke flex items-center justify-center shrink-0">
                  {other.avatarUrl ? (
                    <img src={other.avatarUrl} alt={other.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-steel text-sm">
                      {(other.name ?? '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${unread ? 'font-semibold text-ink' : 'text-ink'}`}>{other.name ?? 'Unknown'}</p>
                  <p className="text-xs text-ash truncate mt-0.5">{msg.body}</p>
                </div>
                {unread && <span className="w-2 h-2 bg-brand-red rounded-full shrink-0" />}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
