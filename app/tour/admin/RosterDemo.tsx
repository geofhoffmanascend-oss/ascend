'use client'
import { useEffect, useState } from 'react'

const ROSTER = [
  { name: 'Jordan Lee', belt: 'blue' },
  { name: 'Alex Rivera', belt: 'white' },
  { name: 'Morgan Davis', belt: 'blue' },
  { name: 'Sam Chen', belt: 'white' },
  { name: 'Taylor Brown', belt: 'purple' },
]

export function RosterDemo() {
  const [visible, setVisible] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    if (visible >= ROSTER.length) {
      const t = setTimeout(() => setShowSummary(true), 600)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisible(v => v + 1), 500)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <div className="p-4 flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2">Advanced Gi — Thursday</p>
      {ROSTER.slice(0, visible).map((student, i) => (
        <div key={i} className="flex items-center justify-between py-2 px-3 bg-ink-soft/60 border border-smoke/20 rounded animate-fade-in">
          <span className="text-sm text-paper">{student.name}</span>
          <span className="text-xs px-2 py-0.5 bg-green-800/40 text-green-400 font-bold">Checked In</span>
        </div>
      ))}
      {showSummary && (
        <div className="mt-2 p-3 border border-brand-red/30 bg-brand-red/10 rounded animate-fade-in flex items-center justify-between">
          <span className="text-sm font-bold text-paper">Attendance Summary</span>
          <span className="text-sm text-ash">{ROSTER.length} Present / 0 Absent</span>
        </div>
      )}
    </div>
  )
}
