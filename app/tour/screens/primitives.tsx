// Small inert UI primitives shared by mock tour screens. Match the real design tokens.

export function PageHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-2">
        {kicker}
      </span>
      <h1 className="font-display text-2xl text-ink">{title}</h1>
    </div>
  )
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-steel mb-2">{children}</p>
}

export function Card({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return (
    <div className={`border border-smoke bg-paper p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function PrimaryBtn({ children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className="inline-block bg-brand-red text-paper font-bold text-sm tracking-wide px-4 py-2 cursor-default"
      {...rest}
    >
      {children}
    </span>
  )
}

export function GhostBtn({ children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className="inline-block border border-smoke text-steel text-sm font-medium px-4 py-2 cursor-default"
      {...rest}
    >
      {children}
    </span>
  )
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <span className="w-9 h-9 rounded-full bg-steel flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-paper">{initials}</span>
    </span>
  )
}
