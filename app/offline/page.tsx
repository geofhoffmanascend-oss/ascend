'use client'

export default function OfflinePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="inline-block bg-brand-red px-3 py-1 mb-6">
        <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">
          Offline
        </span>
      </div>
      <h1 className="font-display text-2xl text-ink mb-3">No connection</h1>
      <p className="text-ash text-sm mb-6">
        You're offline. Previously visited pages may still be available.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
