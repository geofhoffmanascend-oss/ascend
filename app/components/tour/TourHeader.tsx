'use client'
import Link from 'next/link'

export function TourHeader({ variant = 'student' }: { variant?: 'student' | 'admin' }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ink-soft/95 backdrop-blur-sm border-b border-steel/30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="AscendIt" width={28} height={28} className="object-contain" />
          <span className="font-display font-bold text-paper text-lg tracking-tight">AscendIt</span>
          {variant === 'admin' && (
            <span className="ml-2 px-2 py-0.5 bg-brand-red text-paper text-xs font-bold uppercase tracking-wide">For Gyms</span>
          )}
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-paper/70 text-sm hover:text-paper transition-colors">Sign In</Link>
          <Link href="/register" className="px-4 py-2 bg-brand-red text-paper text-sm font-bold tracking-wide hover:bg-brand-red-dark transition-colors">Join Free</Link>
        </div>
      </div>
    </header>
  )
}
