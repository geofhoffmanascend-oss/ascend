'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { NotificationType } from '@prisma/client'

type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<NotificationType, string> = {
  class_update:    '📅',
  instructor_note: '📋',
  private_message: '✉️',
  checkin_prompt:  '✅',
  feedback_prompt: '💬',
  general:         '🔔',
}

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initial)
  const [marking, setMarking] = useState(false)

  const unread = notifications.filter(n => !n.read).length

  async function markAllRead() {
    setMarking(true)
    await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    setMarking(false)
    mutate('/api/notifications/unread-count')
    router.refresh()
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))
      mutate('/api/notifications/unread-count')
    }
    if (n.link) router.push(n.link)
  }

  if (notifications.length === 0) {
    return (
      <div className="border border-smoke bg-paper p-10 text-center">
        <p className="text-ash text-sm">No notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-xs text-steel hover:text-ink transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      )}
      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => handleClick(n)}
          className={`border bg-paper p-4 flex items-start gap-3 transition-colors ${
            n.link ? 'cursor-pointer hover:border-steel' : ''
          } ${n.read ? 'border-smoke' : 'border-brand-red'}`}
        >
          <span className="text-lg leading-none mt-0.5">{TYPE_ICON[n.type]}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${n.read ? 'text-ink' : 'font-semibold text-ink'}`}>{n.title}</p>
            {n.body && <p className="text-xs text-ash mt-0.5 truncate">{n.body}</p>}
            <p className="text-xs text-ash mt-1">
              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          {!n.read && <span className="w-2 h-2 bg-brand-red rounded-full mt-1.5 shrink-0" />}
        </div>
      ))}
    </div>
  )
}
