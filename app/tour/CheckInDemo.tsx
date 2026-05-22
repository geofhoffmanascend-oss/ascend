'use client'
import { useEffect, useState } from 'react'

export function CheckInDemo() {
  const [checkedIn, setCheckedIn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCheckedIn(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="border border-smoke/20 bg-ink-soft/60 p-4 rounded-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-1">Tonight</p>
        <p className="text-paper font-bold text-base">Advanced Gi</p>
        <p className="text-ash text-sm">6:30 PM · Marcus Silva · 15 registered</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 border border-smoke/20 bg-ink-soft/60 p-3 rounded-lg text-center">
          <p className="text-xs text-ash mb-1">Check in via app</p>
          <button
            className={`w-full py-3 font-bold text-sm tracking-wide transition-all duration-500 ${
              checkedIn
                ? 'bg-green-700 text-white'
                : 'bg-brand-red text-paper hover:bg-brand-red-dark'
            }`}
          >
            {checkedIn ? 'Checked In ✓' : 'Check In'}
          </button>
        </div>
        <div className="flex-1 border border-smoke/20 bg-ink-soft/60 p-3 rounded-lg text-center">
          <p className="text-xs text-ash mb-1">Or show QR at door</p>
          <div className="mx-auto w-12 h-12 bg-paper/10 border border-smoke/20 rounded flex items-center justify-center">
            <svg className="w-8 h-8 text-ash" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm1 1h3v3H5V5zM3 14h7v7H3v-7zm1 1v5h5v-5H4zm1 1h3v3H5v-3zM14 3h7v7h-7V3zm1 1v5h5V4h-5zm1 1h3v3h-3V5zM14 14h2v2h-2v-2zm2 0h2v-2h2v2h-2v2h2v2h-2v2h-2v-2h-2v2h-2v-2h2v-2h-2v-2h2v2zm2 2v2h2v-2h-2zm0 4v-2h-2v2h2z"/>
            </svg>
          </div>
        </div>
      </div>

      {checkedIn && (
        <p className="text-xs text-green-400 text-center animate-fade-in">
          Attendance logged automatically
        </p>
      )}
    </div>
  )
}
