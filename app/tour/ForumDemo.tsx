'use client'
import { useEffect, useState } from 'react'
import { TOUR_FORUM_POSTS } from '@/lib/tourData'
import { MockBelt } from '@/app/components/tour/MockBelt'

const BELT_INITIALS: Record<string, string> = {
  black: 'MS',
  blue: 'JL',
  white: 'SC',
  brown: 'DK',
}

export function ForumDemo() {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (visible >= TOUR_FORUM_POSTS.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1000)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-1">Advanced Gi — Thursday</p>
      {TOUR_FORUM_POSTS.slice(0, visible).map((post, i) => (
        <div key={i} className="border border-smoke/20 bg-ink-soft/60 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-steel flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-paper">{BELT_INITIALS[post.belt] ?? post.author[0]}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-paper">{post.author}</span>
                <MockBelt belt={post.belt} />
              </div>
              <span className="text-xs text-ash">{post.time}</span>
            </div>
          </div>
          <p className="text-sm text-ash leading-relaxed">{post.content}</p>
        </div>
      ))}
      {visible < TOUR_FORUM_POSTS.length && (
        <div className="flex items-center gap-1 pl-2">
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
