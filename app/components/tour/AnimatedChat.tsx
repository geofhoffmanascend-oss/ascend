'use client'
import { useEffect, useState } from 'react'

type Message = { from: string; text: string; side: 'left' | 'right'; initials: string; belt: string }

export function AnimatedChat({ messages, delayMs = 800 }: { messages: Message[]; delayMs?: number }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (visible >= messages.length) return
    const t = setTimeout(() => setVisible(v => v + 1), delayMs)
    return () => clearTimeout(t)
  }, [visible, messages.length, delayMs])

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.slice(0, visible).map((msg, i) => (
        <div key={i} className={`flex items-end gap-2 ${msg.side === 'right' ? 'flex-row-reverse' : ''} animate-fade-in`}>
          <div className="w-7 h-7 rounded-full bg-steel flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-paper">{msg.initials}</span>
          </div>
          <div className={`max-w-xs px-3 py-2 text-sm rounded-lg ${msg.side === 'right' ? 'bg-brand-red text-paper rounded-br-none' : 'bg-mist text-ink rounded-bl-none'}`}>
            {msg.text}
          </div>
        </div>
      ))}
      {visible < messages.length && (
        <div className="flex items-center gap-1 pl-9">
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
