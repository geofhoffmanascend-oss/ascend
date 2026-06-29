import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/database'
import { isChatMember } from '@/lib/groupChat'
import { ChatRoom } from './ChatRoom'
import { JoinChat } from './JoinChat'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chat = await prisma.forum.findUnique({ where: { id }, select: { title: true, type: true } })
  return { title: chat?.type === 'group_chat' ? chat.title : 'Chat' }
}

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const { id } = await params

  const chat = await prisma.forum.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, type: true, gym: { select: { name: true } }, _count: { select: { subscriptions: true } } },
  })
  if (!chat || chat.type !== 'group_chat') notFound()

  const member = await isChatMember(session.user.id, id)

  // Non-members see a join screen, not the conversation.
  if (!member) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Link href="/chats" className="text-xs text-ash hover:text-ink">← All chats</Link>
        <h1 className="font-display text-2xl text-ink mt-3">{chat.title}</h1>
        {chat.gym && <p className="text-sm text-slate mt-1">{chat.gym.name}</p>}
        <p className="text-sm text-slate mt-1">{chat._count.subscriptions} members</p>
        {chat.description && <p className="text-sm text-ink mt-3">{chat.description}</p>}
        <div className="mt-6"><JoinChat chatId={id} /></div>
      </div>
    )
  }

  const [messages, members, requests] = await Promise.all([
    prisma.post.findMany({
      where: { forumId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        id: true, content: true, imageUrl: true, createdAt: true, authorId: true,
        author: { select: { name: true, avatarUrl: true } },
      },
    }),
    prisma.forumSubscription.findMany({
      where: { forumId: id },
      select: { user: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.forumJoinRequest.findMany({
      where: { forumId: id, status: 'pending' },
      select: { id: true, user: { select: { id: true, name: true } } },
    }),
  ])

  return (
    <ChatRoom
      chatId={id}
      title={chat.title}
      gymName={chat.gym?.name ?? null}
      meId={session.user.id}
      initialMessages={messages.map(m => ({
        id: m.id, content: m.content, imageUrl: m.imageUrl ?? null,
        createdAt: m.createdAt.toISOString(), authorId: m.authorId,
        authorName: m.author?.name ?? 'User',
      }))}
      members={members.map(s => ({ id: s.user.id, name: s.user.name ?? 'User' }))}
      requests={requests.map(r => ({ id: r.id, userId: r.user.id, name: r.user.name ?? 'User' }))}
    />
  )
}
