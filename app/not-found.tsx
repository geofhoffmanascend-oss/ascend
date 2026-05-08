import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-full bg-paper flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block bg-brand-red px-3 py-1 mb-6">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">404</span>
        </div>
        <h1 className="font-display text-4xl text-ink mb-3">Page not found</h1>
        <p className="text-ash text-sm mb-8">This page doesn't exist or has been moved.</p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
