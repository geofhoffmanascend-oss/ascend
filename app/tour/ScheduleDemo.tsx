'use client'
import { useEffect, useState } from 'react'
import { TOUR_SCHEDULE } from '@/lib/tourData'

const TYPE_LABELS: Record<string, string> = {
  nogi: 'No-Gi',
  fundamentals: 'Fundamentals',
  gi: 'Gi',
  competition_prep: 'Comp Prep',
}

export function ScheduleDemo() {
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRegistered(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col divide-y divide-smoke/20">
      {TOUR_SCHEDULE.map((cls, i) => {
        const isTarget = i === 2
        return (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-3 gap-3 transition-all duration-500 ${
              isTarget && !registered ? 'border border-brand-red/60 animate-pulse-glow bg-brand-red/5' :
              isTarget && registered ? 'border border-green-600/40 bg-green-900/10' : ''
            }`}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-ash font-mono">{cls.time}</span>
              <span className="text-sm font-bold text-paper truncate">{cls.title}</span>
              <span className="text-xs text-slate">{cls.instructor} · {cls.count} registered</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs px-2 py-0.5 bg-steel/30 text-ash rounded">{TYPE_LABELS[cls.type] ?? cls.type}</span>
              {isTarget && (
                <button
                  className={`text-xs font-bold px-3 py-1.5 transition-all duration-500 ${
                    registered
                      ? 'bg-green-700 text-white'
                      : 'bg-brand-red text-paper hover:bg-brand-red-dark'
                  }`}
                >
                  {registered ? 'Registered ✓' : 'Register'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
