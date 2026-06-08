import Link from 'next/link'
import { BetaNotice } from './BetaNotice'

export function Footer() {
  return (
    <footer>
      <BetaNotice variant="footer" />
      <div className="border-t border-smoke bg-mist">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4 flex-wrap">
          <p className="font-display text-xs font-bold tracking-widest uppercase text-steel">
            AscendIt
          </p>
          <div className="flex items-center gap-4 text-xs text-ash">
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <span className="hidden sm:inline">The Journey. The Art. The Community.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
