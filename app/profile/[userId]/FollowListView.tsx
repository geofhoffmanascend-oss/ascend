import Link from 'next/link'
import { BeltBadge } from '@/app/components/BeltBadge'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'
export type Person = { id: string; name: string | null; belt: Belt; stripes: number; avatarUrl: string | null }

// Shared presentational list of members (used by the followers + following pages).
export function FollowListView({
  title, subjectName, backHref, people, emptyText,
}: {
  title: string
  subjectName: string
  backHref: string
  people: Person[]
  emptyText: string
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link href={backHref} className="text-sm text-slate hover:text-ink">← {subjectName}</Link>
      <h1 className="font-display text-2xl font-bold text-ink mt-3 mb-6">{title}</h1>

      {people.length === 0 ? (
        <p className="text-sm text-slate">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {people.map(p => (
            <li key={p.id}>
              <Link href={`/profile/${p.id}`} className="flex items-center gap-3 border border-smoke bg-paper p-3 hover:border-steel transition-colors">
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt={p.name ?? 'Avatar'} className="w-10 h-10 rounded-full object-cover border border-smoke" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-mist border border-smoke flex items-center justify-center font-display font-bold text-steel">
                    {(p.name ?? '?')[0].toUpperCase()}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-ink truncate">{p.name ?? 'Unknown'}</span>
                </span>
                <BeltBadge belt={p.belt} stripes={p.stripes} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
