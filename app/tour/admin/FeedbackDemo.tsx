'use client'
import { useEffect, useState } from 'react'
import { ADMIN_FEEDBACK } from '@/lib/tourData'
import { MockBelt } from '@/app/components/tour/MockBelt'

export function FeedbackDemo() {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (visible >= ADMIN_FEEDBACK.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 900)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <div className="p-4 flex flex-col gap-3">
      {ADMIN_FEEDBACK.slice(0, visible).map((fb, i) => (
        <div key={i} className="border border-smoke/20 bg-ink-soft/60 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-paper">{fb.student}</span>
              {fb.belt && <MockBelt belt={fb.belt} />}
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              fb.sentiment === 'positive'
                ? 'bg-green-800/40 text-green-400'
                : 'bg-amber-800/40 text-amber-400'
            }`}>
              {fb.sentiment === 'positive' ? 'Positive' : 'Concern'}
            </span>
          </div>
          <p className="text-sm text-ash leading-relaxed">{fb.text}</p>
        </div>
      ))}
      {visible < ADMIN_FEEDBACK.length && (
        <div className="flex items-center gap-1 pl-2">
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-steel/50 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
