'use client'
import { useEffect, useState } from 'react'

const CLASSES = [
  { time: '6:00 AM', title: 'Morning No-Gi', instructor: 'Marcus', count: 8 },
  { time: '12:00 PM', title: 'Fundamentals', instructor: 'Dana', count: 12 },
  { time: '6:30 PM', title: 'Advanced Gi', instructor: 'Marcus', count: 15, subRequest: true },
]

export function ScheduleAdminDemo() {
  const [showPrivate, setShowPrivate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowPrivate(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="p-4 flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2">This Week</p>
      {CLASSES.map((cls, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-ink-soft/60 border border-smoke/20 rounded">
          <div>
            <p className="text-sm font-bold text-paper">{cls.title}</p>
            <p className="text-xs text-ash">{cls.time} · {cls.instructor} · {cls.count} registered</p>
          </div>
          {cls.subRequest && (
            <span className="text-xs font-bold px-2 py-0.5 bg-amber-800/40 text-amber-400 rounded animate-fade-in">
              Sub Request
            </span>
          )}
        </div>
      ))}
      {showPrivate && (
        <div className="flex items-center justify-between py-2.5 px-3 bg-brand-red/10 border border-brand-red/30 rounded animate-slide-in">
          <div>
            <p className="text-sm font-bold text-paper">Private: Marcus → Jordan</p>
            <p className="text-xs text-ash">Saturday 10:00 AM · Leg Lock Defense</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-brand-red/30 text-paper rounded">Private</span>
        </div>
      )}
    </div>
  )
}
