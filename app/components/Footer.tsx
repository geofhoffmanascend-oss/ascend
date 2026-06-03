import { BetaNotice } from './BetaNotice'

export function Footer() {
  return (
    <footer>
      <BetaNotice variant="footer" />
      <div className="border-t border-smoke bg-mist">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <p className="font-display text-xs font-bold tracking-widest uppercase text-steel">
            AscendIt
          </p>
          <p className="text-xs text-ash">The Journey. The Art. The Community.</p>
        </div>
      </div>
    </footer>
  )
}
