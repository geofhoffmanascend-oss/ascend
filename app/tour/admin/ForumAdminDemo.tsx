'use client'
import { useEffect, useState } from 'react'

const POSTS = [
  { author: 'Marcus', initials: 'MS', time: '2 days ago', content: "Great rolling session tonight. Focus on maintaining frames when defending mount — we'll drill this Thursday." },
  { author: 'Jordan', initials: 'JL', time: '1 day ago', content: 'Question on the hip escape — should my bottom knee be pointed up or out when bridging?' },
]

export function ForumAdminDemo() {
  const [pinned, setPinned] = useState(false)
  const [showDM, setShowDM] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPinned(true), 1500)
    const t2 = setTimeout(() => setShowDM(true), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-1">Forum Moderation</p>
      {POSTS.map((post, i) => (
        <div key={i} className={`border rounded-lg p-3 transition-all duration-500 ${i === 0 && pinned ? 'border-brand-red/40 bg-brand-red/10' : 'border-smoke/20 bg-ink-soft/60'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-steel flex items-center justify-center">
                <span className="text-xs font-bold text-paper">{post.initials}</span>
              </div>
              <span className="text-sm font-bold text-paper">{post.author}</span>
              <span className="text-xs text-ash">{post.time}</span>
            </div>
            {i === 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded transition-all duration-500 ${pinned ? 'bg-brand-red text-paper' : 'border border-smoke/40 text-ash'}`}>
                {pinned ? 'Pinned ✓' : 'Pin'}
              </span>
            )}
          </div>
          <p className="text-xs text-ash leading-relaxed">{post.content}</p>
        </div>
      ))}
      {showDM && (
        <div className="border border-steel/40 bg-ink-soft/60 rounded-lg p-3 animate-slide-in">
          <p className="text-xs font-bold uppercase tracking-widest text-slate mb-2">DM Preview</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ash w-14 flex-shrink-0">Jordan →</span>
              <span className="text-xs text-paper truncate">Hey Marcus, can we schedule a private lesson on leg lock defense?</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ash w-14 flex-shrink-0">Marcus →</span>
              <span className="text-xs text-paper truncate">Absolutely. Saturday 10am works. See you then.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
