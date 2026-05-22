'use client'
import { useEffect, useState } from 'react'
import { TOUR_JOURNAL } from '@/lib/tourData'

export function JournalDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= 3) return
    const t = setTimeout(() => setStep(s => s + 1), 700)
    return () => clearTimeout(t)
  }, [step])

  return (
    <div className="p-5 flex flex-col gap-4">
      {step >= 1 && (
        <div className="animate-fade-in">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-1">Session Title</p>
          <p className="font-display font-bold text-paper text-lg">{TOUR_JOURNAL.title}</p>
        </div>
      )}
      {step >= 2 && (
        <div className="animate-fade-in border-l-2 border-brand-red/40 pl-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate mb-1">Technique Note</p>
          <p className="text-sm text-ash leading-relaxed">{TOUR_JOURNAL.technique}</p>
        </div>
      )}
      {step >= 3 && (
        <div className="animate-fade-in border-l-2 border-steel/40 pl-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate mb-1">Goal</p>
          <p className="text-sm text-ash leading-relaxed">{TOUR_JOURNAL.goal}</p>
        </div>
      )}
      {step >= 3 && (
        <div className="flex gap-4 mt-1 animate-fade-in">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-slate">Energy</span>
            <span className="font-bold text-paper text-sm">{TOUR_JOURNAL.energy}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-slate">Focus</span>
            <span className="font-bold text-paper text-sm">{TOUR_JOURNAL.focus}</span>
          </div>
        </div>
      )}
    </div>
  )
}
