'use client'

import { usePathname } from 'next/navigation'

// Renders the app chrome (view-as banner, header, footer) around the page —
// except on bare full-bleed routes like the public scoreboard, which should
// fill the screen for TV display.
export function LayoutChrome({
  banner, header, footer, children,
}: {
  banner: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const bare = pathname?.startsWith('/scoreboard/')

  if (bare) return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col">
      {banner}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  )
}
