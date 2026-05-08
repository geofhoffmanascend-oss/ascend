'use client'

import Link from 'next/link'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block bg-brand-red px-3 py-1 mb-6">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Error</span>
        </div>
        <h1 className="font-display text-4xl text-ink mb-3">Something went wrong</h1>
        <p className="text-ash text-sm mb-8">An unexpected error occurred.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
