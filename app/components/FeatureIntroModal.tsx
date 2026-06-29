'use client'

import { useState } from 'react'

// First-visit explainer for a feature. "Got it" closes for now (shows again next visit);
// "Don't show this again" persists the dismissal (per-user) so it never shows again.
export function FeatureIntroModal({
  featureKey, title, body, onClose,
}: {
  featureKey: string; title: string; body: string; onClose: (persisted: boolean) => void
}) {
  const [busy, setBusy] = useState(false)

  async function dontShowAgain() {
    setBusy(true)
    try {
      await fetch('/api/feature-intros/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey }),
      })
    } catch { /* ignore */ }
    onClose(true)
  }

  return (
    <div className="fixed inset-0 z-[2147483000] bg-ink/70 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-paper border border-smoke p-6 flex flex-col gap-4">
        <div>
          <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-2">
            {title}
          </span>
          <p className="text-sm text-slate leading-relaxed">{body}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button onClick={dontShowAgain} disabled={busy} className="text-xs text-slate hover:text-ink">
            Don’t show this again
          </button>
          <button onClick={() => onClose(false)} className="bg-brand-red text-paper font-bold text-sm px-4 py-2 hover:bg-red-700 transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
