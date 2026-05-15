import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { RequestActions } from './RequestActions'

export default async function MessageRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const requests = await prisma.messageRequest.findMany({
    where: { recipientId: session.user.id, status: 'pending' },
    include: { sender: { select: { id: true, name: true, avatarUrl: true, belt: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2">
        <Link href="/messages" className="text-xs text-ash hover:text-ink transition-colors">← Messages</Link>
      </div>
      <div className="mb-8">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
            Messages
          </span>
        </div>
        <h1 className="font-display text-2xl text-ink">Message Requests</h1>
        <p className="text-sm text-ash mt-1">
          These users want to send you a message. Accept to start a conversation, or decline to ignore.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="border border-smoke bg-paper p-10 text-center">
          <p className="text-ash text-sm">No pending requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map(req => (
            <div key={req.id} className="border border-smoke bg-paper p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mist border border-smoke flex items-center justify-center shrink-0">
                  {req.sender.avatarUrl ? (
                    <img src={req.sender.avatarUrl} alt={req.sender.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-steel text-sm">
                      {(req.sender.name ?? '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-ink font-medium">{req.sender.name ?? 'Unknown'}</p>
                  <p className="text-xs text-ash capitalize">{req.sender.belt} belt</p>
                </div>
                <span className="ml-auto text-xs text-ash">
                  {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="bg-mist border border-smoke px-4 py-3 text-sm text-ink italic">
                "{req.initialMessage}"
              </div>

              <RequestActions requestId={req.id} senderId={req.sender.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
