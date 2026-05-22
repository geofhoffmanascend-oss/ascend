'use client'
import { AnimatedCounter } from '@/app/components/tour/AnimatedCounter'
import { ADMIN_STATS } from '@/lib/tourData'
import { MockBelt } from '@/app/components/tour/MockBelt'

const BELT_COUNTS = [
  { belt: 'black', count: 3 },
  { belt: 'brown', count: 4 },
  { belt: 'purple', count: 8 },
  { belt: 'blue', count: 16 },
  { belt: 'white', count: 16 },
]

export function StatsDemo() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Students', value: ADMIN_STATS.totalStudents },
          { label: 'Sessions This Week', value: ADMIN_STATS.sessionsThisWeek },
          { label: 'Check-Ins Today', value: ADMIN_STATS.checkInsToday },
          { label: 'New This Month', value: ADMIN_STATS.newSignupsThisMonth },
        ].map(({ label, value }) => (
          <div key={label} className="border border-smoke/20 bg-ink-soft/60 rounded p-3">
            <p className="font-display font-bold text-paper text-2xl">
              <AnimatedCounter target={value} />
            </p>
            <p className="text-xs text-ash mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate mb-3">Belt Breakdown</p>
        <div className="flex flex-col gap-2">
          {BELT_COUNTS.map(({ belt, count }) => (
            <div key={belt} className="flex items-center gap-3">
              <MockBelt belt={belt} />
              <div className="flex-1 bg-steel/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-brand-red/70 rounded-full transition-all"
                  style={{ width: `${(count / ADMIN_STATS.totalStudents) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ash w-5 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
